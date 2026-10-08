/**
 * Persistence for the demand context.
 *
 * Note what is NOT here: no captcha, no rate limiting, no notification. This
 * class only knows how to read and write rows (Single Responsibility), which
 * is what allows LeadService to be tested against an in-memory fake with no
 * database at all.
 */
import { desc, eq, sql } from "drizzle-orm";

import { NotFoundError } from "@/core";
import { db, dbRead, type Executor } from "@/lib/db";
import { lead, leadItem, type LeadStatus, type LeadType } from "@/db/schema";

export interface PersistLeadCommand {
  readonly ref: string;
  readonly type: LeadType;
  readonly name: string;
  readonly email: string;
  readonly phone?: string | undefined;
  readonly company?: string | undefined;
  readonly city?: string | undefined;
  readonly message?: string | undefined;
  readonly source: Record<string, unknown>;
  readonly consentAt: Date;
  readonly ipHash: Buffer | null;
  readonly idempotencyKey?: string | undefined;
  readonly items: readonly {
    readonly productId?: string | undefined;
    readonly variantId?: string | undefined;
    readonly qty: number;
    readonly note?: string | undefined;
  }[];
}

export interface LeadSummary {
  readonly id: string;
  readonly ref: string;
  readonly type: LeadType;
  readonly name: string;
  readonly email: string;
  readonly status: LeadStatus;
  readonly createdAt: Date;
}

export interface LeadRepositoryPort {
  insert(tx: Executor, command: PersistLeadCommand): Promise<{ id: string; ref: string }>;
  findByIdempotencyKey(key: string): Promise<{ id: string; ref: string } | null>;
  findByRef(ref: string): Promise<LeadSummary>;
  countSince(since: Date): Promise<number>;
  recentForTriage(limit: number): Promise<LeadSummary[]>;
}

export class LeadRepository implements LeadRepositoryPort {
  /**
   * Writes the lead and its line items. Takes an Executor so the caller can
   * — and must — supply the transaction that also carries the outbox row.
   */
  async insert(
    tx: Executor,
    command: PersistLeadCommand,
  ): Promise<{ id: string; ref: string }> {
    const [row] = await tx
      .insert(lead)
      .values({
        ref: command.ref,
        type: command.type,
        name: command.name,
        email: command.email,
        phone: command.phone ?? null,
        company: command.company ?? null,
        city: command.city ?? null,
        message: command.message ?? null,
        source: command.source,
        consentAt: command.consentAt,
        ipHash: command.ipHash,
        idempotencyKey: command.idempotencyKey ?? null,
      })
      .returning({ id: lead.id, ref: lead.ref });

    if (!row) throw new Error("lead insert returned no row");

    if (command.items.length > 0) {
      await tx.insert(leadItem).values(
        command.items.map((item) => ({
          leadId: row.id,
          productId: item.productId ?? null,
          variantId: item.variantId ?? null,
          qty: item.qty,
          note: item.note ?? null,
        })),
      );
    }

    return row;
  }

  /**
   * Resolves a replayed Idempotency-Key to the lead it already created.
   * Used both as a pre-check and as the recovery path after the unique
   * index rejects a concurrent duplicate.
   */
  async findByIdempotencyKey(key: string): Promise<{ id: string; ref: string } | null> {
    const [row] = await dbRead()
      .select({ id: lead.id, ref: lead.ref })
      .from(lead)
      .where(eq(lead.idempotencyKey, key))
      .limit(1);
    return row ?? null;
  }

  async findByRef(ref: string): Promise<LeadSummary> {
    const [row] = await dbRead()
      .select({
        id: lead.id,
        ref: lead.ref,
        type: lead.type,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        createdAt: lead.createdAt,
      })
      .from(lead)
      .where(eq(lead.ref, ref))
      .limit(1);

    if (!row) throw new NotFoundError("Lead", ref);
    return row as LeadSummary;
  }

  /**
   * Powers the "zero leads in a business hour" alarm (HLD.md §6.1). Silent
   * form failure is invisible, and therefore the most expensive bug here.
   */
  async countSince(since: Date): Promise<number> {
    const [row] = await dbRead()
      .select({ n: sql<number>`count(*)::int` })
      .from(lead)
      .where(sql`${lead.createdAt} >= ${since}`);
    return row?.n ?? 0;
  }

  async recentForTriage(limit: number): Promise<LeadSummary[]> {
    const rows = await dbRead()
      .select({
        id: lead.id,
        ref: lead.ref,
        type: lead.type,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        createdAt: lead.createdAt,
      })
      .from(lead)
      .where(sql`${lead.status} <> 'closed'`)
      .orderBy(desc(lead.createdAt))
      .limit(limit);
    return rows as LeadSummary[];
  }

  /** Convenience for jobs that need the full row outside a transaction. */
  async findById(id: string) {
    const [row] = await dbRead().select().from(lead).where(eq(lead.id, id)).limit(1);
    if (!row) throw new NotFoundError("Lead", id);
    return row;
  }

  /** Items for a lead, used when composing the sales notification. */
  async itemsFor(leadId: string) {
    return db().select().from(leadItem).where(eq(leadItem.leadId, leadId));
  }
}
