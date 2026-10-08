/**
 * Data access for the outbox table. No business decisions live here — this
 * class knows SQL and nothing else (Single Responsibility), which is what
 * lets the sweeper and the publisher be unit-tested against a fake.
 */
import { and, asc, eq, isNull, lt, sql } from "drizzle-orm";

import type { Clock } from "@/core";
import { db, dbRead, type Executor } from "@/lib/db";
import { outbox } from "@/db/schema";

export interface OutboxRecord {
  readonly id: bigint;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly attempts: number;
}

export interface NewOutboxEvent {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
}

/**
 * Re-exported so call sites can keep importing the persistence vocabulary
 * from the module they are already using. The type itself is owned by
 * lib/db.ts, because "what can run a query" is a persistence concern rather
 * than an outbox one.
 */
export type { Executor };

export interface OutboxRepositoryPort {
  enqueue(tx: Executor, event: NewOutboxEvent): Promise<bigint>;
  findUnpublished(limit: number): Promise<OutboxRecord[]>;
  markPublished(id: bigint): Promise<void>;
  recordFailure(id: bigint, error: string): Promise<void>;
  countUnpublished(): Promise<number>;
  countStuck(olderThanMinutes: number, minAttempts: number): Promise<number>;
  prunePublished(olderThanDays: number): Promise<number>;
}

export class OutboxRepository implements OutboxRepositoryPort {
  constructor(private readonly clock: Clock) {}

  /**
   * MUST be called with the same `tx` as the business row. That co-commit is
   * the entire durability guarantee — accepting an Executor rather than
   * reaching for the global `db()` is what makes misuse hard.
   */
  async enqueue(tx: Executor, event: NewOutboxEvent): Promise<bigint> {
    const [row] = await tx
      .insert(outbox)
      .values({
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload,
      })
      .returning({ id: outbox.id });

    if (!row) throw new Error("outbox insert returned no row");
    return row.id;
  }

  /** Oldest first, so a backlog drains in causal order. */
  async findUnpublished(limit: number): Promise<OutboxRecord[]> {
    const rows = await dbRead()
      .select()
      .from(outbox)
      .where(isNull(outbox.publishedAt))
      .orderBy(asc(outbox.id))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      aggregateType: r.aggregateType,
      aggregateId: r.aggregateId,
      eventType: r.eventType,
      payload: r.payload,
      attempts: r.attempts,
    }));
  }

  async markPublished(id: bigint): Promise<void> {
    await db()
      .update(outbox)
      .set({ publishedAt: this.clock.now(), lastError: null })
      .where(eq(outbox.id, id));
  }

  async recordFailure(id: bigint, error: string): Promise<void> {
    await db()
      .update(outbox)
      .set({
        attempts: sql`${outbox.attempts} + 1`,
        // Truncated: a provider stack trace can be enormous and this column
        // is for triage, not forensics.
        lastError: error.slice(0, 500),
      })
      .where(eq(outbox.id, id));
  }

  async countUnpublished(): Promise<number> {
    const [row] = await dbRead()
      .select({ n: sql<number>`count(*)::int` })
      .from(outbox)
      .where(isNull(outbox.publishedAt));
    return row?.n ?? 0;
  }

  /** Feeds the DLQ-depth alarm: undelivered, old, and already retried. */
  async countStuck(olderThanMinutes: number, minAttempts: number): Promise<number> {
    const cutoff = new Date(this.clock.now().getTime() - olderThanMinutes * 60_000);
    const [row] = await dbRead()
      .select({ n: sql<number>`count(*)::int` })
      .from(outbox)
      .where(
        and(
          isNull(outbox.publishedAt),
          lt(outbox.createdAt, cutoff),
          sql`${outbox.attempts} >= ${minAttempts}`,
        ),
      );
    return row?.n ?? 0;
  }

  /** Nightly maintenance. Keeps the table inside the 1 GB Neon budget. */
  async prunePublished(olderThanDays: number): Promise<number> {
    const cutoff = new Date(this.clock.now().getTime() - olderThanDays * 86_400_000);
    const deleted = await db()
      .delete(outbox)
      .where(and(sql`${outbox.publishedAt} IS NOT NULL`, lt(outbox.publishedAt, cutoff)))
      .returning({ id: outbox.id });
    return deleted.length;
  }
}
