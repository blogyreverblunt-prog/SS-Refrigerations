/**
 * Generates the human-quotable lead reference, e.g. 'KLT-2026-00412'.
 *
 * Its own class because it has exactly one reason to change — the format the
 * sales desk reads out on the phone — and that reason has nothing to do with
 * how leads are stored or notified.
 */
import { sql } from "drizzle-orm";

import type { Clock } from "@/core";
import { db } from "@/lib/db";

export interface SequenceSource {
  next(): Promise<number>;
}

/**
 * Postgres sequence. Safe under concurrency: `nextval` is atomic and is not
 * rolled back by a failed transaction, so two simultaneous enquiries can
 * never collide on a reference.
 */
export class PostgresSequence implements SequenceSource {
  constructor(private readonly sequenceName: string) {}

  async next(): Promise<number> {
    // ::regclass makes the text→sequence resolution explicit rather than
    // leaning on an implicit cast.
    const result = await db().execute<{ nextval: string }>(
      sql`SELECT nextval(${this.sequenceName}::regclass) AS nextval`,
    );

    // execute() yields { rows, rowCount, ... } — NOT a bare array. Reading
    // it as an array silently gives undefined on every call.
    const raw = result.rows[0]?.nextval;
    if (raw === undefined) {
      throw new Error(`sequence '${this.sequenceName}' returned no value`);
    }

    // nextval returns bigint, which the driver hands back as a string to
    // avoid precision loss. Number() is safe well past any realistic
    // lead count.
    return Number(raw);
  }
}

/** In-memory counter for tests. */
export class InMemorySequence implements SequenceSource {
  private value = 0;
  async next(): Promise<number> {
    return ++this.value;
  }
}

export class LeadReferenceGenerator {
  constructor(
    private readonly sequence: SequenceSource,
    private readonly clock: Clock,
    private readonly prefix = "KLT",
  ) {}

  async next(): Promise<string> {
    const n = await this.sequence.next();
    const year = this.clock.now().getUTCFullYear();
    // Pads to 5 digits but does not truncate past it — the reference simply
    // grows a digit rather than wrapping and colliding.
    return `${this.prefix}-${year}-${String(n).padStart(5, "0")}`;
  }
}
