/**
 * OutboxPublisher — the opportunistic half of the dispatch pattern.
 *
 * Called immediately after the transaction commits. It tries to hand the
 * event to the queue right away so the normal case is fast, and it is
 * explicitly allowed to fail: the row is already durable and the sweeper is
 * the backstop (HLD-FREE-TIER.md §3.2).
 *
 * The one thing it must do reliably is RAISE THE FLAG, because that is what
 * tells the sweeper there is work without the sweeper having to wake Postgres
 * to find out.
 */
import type { CachePort, JobTask, Logger, QueuePort } from "@/core";
import { WORK_PENDING_KEY } from "./sweeper";

/** Long enough to outlive several sweep intervals, short enough to self-heal. */
const FLAG_TTL_SECONDS = 3_600;

export class OutboxPublisher {
  constructor(
    private readonly queue: QueuePort,
    private readonly cache: CachePort,
    private readonly logger: Logger,
  ) {}

  /**
   * Never throws. Never rejects. The caller has already returned a success
   * to the user by the time this runs, and nothing here is allowed to undo
   * that.
   */
  async dispatch(task: JobTask, outboxId: bigint, payload: unknown): Promise<void> {
    // Flag first: if the process dies between here and the publish, the
    // sweeper still knows to look. The reverse order could strand the event
    // until the nightly forced sweep.
    await this.raiseFlag();

    try {
      const ok = await this.queue.publish(task, { outboxId: String(outboxId), ...(payload as object) });
      if (!ok) {
        this.logger.log("debug", "opportunistic dispatch deferred to sweeper", {
          task,
          outboxId: String(outboxId),
        });
      }
    } catch (cause) {
      // Swallowed on purpose — see the class comment.
      this.logger.log("warn", "opportunistic dispatch threw; sweeper will retry", {
        task,
        outboxId: String(outboxId),
        error: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }

  private async raiseFlag(): Promise<void> {
    try {
      await this.cache.set(WORK_PENDING_KEY, "1", FLAG_TTL_SECONDS);
    } catch {
      // The nightly forced sweep covers a lost flag.
    }
  }
}
