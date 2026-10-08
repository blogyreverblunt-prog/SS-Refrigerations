/**
 * The sweeper — the backstop that makes opportunistic dispatch safe.
 *
 * HLD-FREE-TIER.md §3.2: the lead is committed before anything is enqueued.
 * If QStash was down, slow or over quota at that moment, nothing is lost —
 * this runs every 15 minutes and delivers it late.
 *
 * §4.1 is the constraint that shapes it: Neon Free gives 100 CU-hours/month
 * and scale-to-zero cannot be disabled, so any poll tighter than ~15 minutes
 * keeps the database awake 24/7 and blows the budget by 1.8x. Hence the Redis
 * GATE below — the sweeper asks Redis "is there work?" (a ~1ms command that
 * never wakes Postgres) and only opens a database connection when the answer
 * is yes. On a quiet night that is 96 Redis reads and zero CU-hours.
 */
import type { CachePort, Logger, QueuePort } from "@/core";
import type { OutboxRepositoryPort } from "./repository";

/** Set whenever an event is enqueued; cleared when the backlog is empty. */
export const WORK_PENDING_KEY = "outbox:work-pending";

/** Keep a batch comfortably inside the 60-second function cap. */
const DEFAULT_BATCH_SIZE = 50;

export interface SweepReport {
  readonly skipped: boolean;
  readonly scanned: number;
  readonly delivered: number;
  readonly failed: number;
}

/** Maps an event type onto the job that handles it. */
const EVENT_ROUTES = {
  "lead.created": "lead-notify",
  "catalog.changed": "search-reindex",
  "media.uploaded": "media-derive",
} as const;

type RoutableEvent = keyof typeof EVENT_ROUTES;

function routeFor(eventType: string): (typeof EVENT_ROUTES)[RoutableEvent] | null {
  return EVENT_ROUTES[eventType as RoutableEvent] ?? null;
}

export class OutboxSweeper {
  constructor(
    private readonly repo: OutboxRepositoryPort,
    private readonly queue: QueuePort,
    private readonly cache: CachePort,
    private readonly logger: Logger,
  ) {}

  /**
   * Drain pending events.
   *
   * `force` bypasses the Redis gate — the nightly maintenance job uses it so
   * a lost flag can never strand the queue forever.
   */
  async sweep(batchSize = DEFAULT_BATCH_SIZE, force = false): Promise<SweepReport> {
    if (!force && !(await this.hasWork())) {
      return { skipped: true, scanned: 0, delivered: 0, failed: 0 };
    }

    const pending = await this.repo.findUnpublished(batchSize);
    if (pending.length === 0) {
      await this.cache.delete(WORK_PENDING_KEY);
      return { skipped: false, scanned: 0, delivered: 0, failed: 0 };
    }

    let delivered = 0;
    let failed = 0;

    for (const event of pending) {
      const task = routeFor(event.eventType);

      if (!task) {
        // Unroutable: mark published so it stops being scanned forever, but
        // log loudly — this is a deploy that removed a handler, not a retry.
        this.logger.log("warn", "outbox event has no route; discarding", {
          outboxId: String(event.id),
          eventType: event.eventType,
        });
        await this.repo.markPublished(event.id);
        continue;
      }

      const ok = await this.queue.publish(task, {
        outboxId: String(event.id),
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload,
      });

      if (ok) {
        await this.repo.markPublished(event.id);
        delivered += 1;
      } else {
        await this.repo.recordFailure(event.id, "queue publish returned false");
        failed += 1;
      }
    }

    // Only clear the flag on a fully clean pass; a partial drain means the
    // next run must still come back.
    if (failed === 0 && pending.length < batchSize) {
      await this.cache.delete(WORK_PENDING_KEY);
    }

    this.logger.log("info", "outbox sweep complete", {
      scanned: pending.length,
      delivered,
      failed,
    });

    return { skipped: false, scanned: pending.length, delivered, failed };
  }

  /** The gate. Absent Redis, always returns true and the DB decides. */
  /**
   * The gate, and it FAILS OPEN.
   *
   * With no cache configured there is no flag to read, and treating that
   * as "no work" would disable the backstop entirely — events would sit
   * unpublished until the nightly forced sweep. The gate exists only to
   * keep Postgres asleep on a quiet night; when it cannot be consulted,
   * the correct answer is to go and look.
   */
  private async hasWork(): Promise<boolean> {
    if (!this.cache.available) return true;
    const flag = await this.cache.get<string>(WORK_PENDING_KEY);
    return flag !== null;
  }
}
