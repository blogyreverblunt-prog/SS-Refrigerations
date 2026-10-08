/**
 * Bounded context: DEMAND  (HLD.md §7.2)
 *
 * This is the only revenue-carrying write in the system, and §7.3 #4 governs
 * it: demand is IMMUTABLE. A lead row is never edited in place. Status
 * transitions append to `audit_log`, which is how you answer "who touched this
 * enquiry, and when" during a commission dispute.
 *
 * An RFQ is one `lead` plus N `lead_item` rows — that is the quote cart, and
 * it is also why the pricing seam needs nothing added later: model + quantity
 * is already captured here.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { bytea, citext } from "../types";
import { product, productVariant } from "./catalog";
import { appUser } from "./platform";

/**
 * Supplies the counter in 'KLT-2026-00412'.
 *
 * A sequence rather than `count(*) + 1`: the latter races under concurrency
 * and would hand two simultaneous enquiries the same reference — which is
 * exactly the number a customer reads back to you on the phone.
 */
export const leadRefSeq = pgSequence("lead_ref_seq", { startWith: 1, increment: 1 });

export const LEAD_TYPE = ["contact", "rfq", "support", "callback", "demo"] as const;
export type LeadType = (typeof LEAD_TYPE)[number];

export const LEAD_STATUS = [
  "new",
  "triaged",
  "contacted",
  "quoted",
  "won",
  "lost",
  "closed",
  "spam",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const lead = pgTable(
  "lead",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-quotable on the phone, e.g. 'KLT-2026-00412'. */
    ref: text("ref").notNull().unique(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    email: citext("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    city: text("city"),
    message: text("message"),
    /** utm_*, referrer, landing path. Attribution without a tracking vendor. */
    source: jsonb("source").notNull().default({}),
    status: text("status").notNull().default("new"),
    ownerId: uuid("owner_id").references(() => appUser.id),
    crmRef: text("crm_ref"),
    /** DPDP: when they consented, and to what. Not nullable, by design. */
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    /** HMAC'd. A raw IP is never written to this table. */
    ipHash: bytea("ip_hash"),
    /**
     * Client-supplied Idempotency-Key.
     *
     * Redis is the fast path for collapsing double-clicks, but Redis is
     * optional in this design and a duplicate enquiry is a real cost to the
     * sales desk. The unique index below makes the guarantee hold on the
     * database — the same place the durability boundary already is — so it
     * survives a Redis outage or a deployment that has no Redis at all.
     */
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("lead_type_valid", sql`${t.type} IN ('contact','rfq','support','callback','demo')`),
    // Append-only time column: BRIN is ~1000x smaller than the B-tree here.
    index("lead_created_brin").using("brin", t.createdAt),
    // The triage queue. Partial, so closed leads cost nothing to carry.
    index("lead_triage_idx")
      .on(t.status, t.createdAt.desc())
      .where(sql`${t.status} <> 'closed'`),
    // Partial unique: most leads carry no key, and NULLs must not collide.
    uniqueIndex("lead_idempotency_key_uq")
      .on(t.idempotencyKey)
      .where(sql`${t.idempotencyKey} IS NOT NULL`),
  ],
);

/**
 * The quote cart. An RFQ is one lead plus N of these.
 *
 * HLD.md §7.2 specifies `PRIMARY KEY (lead_id, product_id, variant_id)`, and
 * that DDL cannot work: Postgres makes every primary-key column implicitly
 * NOT NULL, while the same block declares `product_id` and `variant_id`
 * nullable. The contradiction makes the common case impossible — a buyer
 * enquiring about a product FAMILY, before anyone has chosen a model code.
 *
 * Corrected here with a surrogate key plus a unique constraint using
 * NULLS NOT DISTINCT (Postgres 15+), which preserves the intent — the same
 * product or variant cannot be added to one lead twice, quantity is the
 * place to say "more of it" — while allowing a product-level line.
 */
export const leadItem = pgTable(
  "lead_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => lead.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => product.id),
    variantId: uuid("variant_id").references(() => productVariant.id),
    qty: integer("qty").notNull().default(1),
    note: text("note"),
  },
  (t) => [
    check("lead_item_qty_positive", sql`${t.qty} > 0`),
    // A line that points at neither a product nor a variant is not a quote
    // request, it is a row nobody can price.
    check(
      "lead_item_target_present",
      sql`${t.productId} IS NOT NULL OR ${t.variantId} IS NOT NULL`,
    ),
    // `unique()`, not `uniqueIndex()`: NULLS NOT DISTINCT is a constraint
    // property in Drizzle's API, and it is the whole point here — without
    // it two product-level lines for the same product would both be allowed.
    unique("lead_item_unique")
      .on(t.leadId, t.productId, t.variantId)
      .nullsNotDistinct(),
    index("lead_item_lead_idx").on(t.leadId),
  ],
);
