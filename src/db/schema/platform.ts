/**
 * Bounded context: PLATFORM  (HLD.md §7.2)
 *
 * The async backbone lives here. The `outbox` table is the load-bearing
 * pattern of the whole design (HLD.md §5 Layer 7): the event row is written in
 * the SAME transaction as the business row, so there is no dual-write race and
 * no two-phase commit. What changes between the paid and free designs is only
 * the relay — Debezium+Kafka, or one HTTP call to QStash. The table does not
 * change, which is why it is worth getting right once.
 */
import { sql } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const USER_ROLE = ["admin", "editor", "sales"] as const;
export type UserRole = (typeof USER_ROLE)[number];

/** Three staff users. Auth.js magic link — no password system is built. */
export const appUser = pgTable("app_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("editor"),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------
 * outbox — the durability boundary
 * ---------------------------------------------------------------------- */

export const outbox = pgTable(
  "outbox",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    /** 'lead.created', 'catalog.changed', … */
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
  },
  (t) => [
    /**
     * The only genuinely hot scan in the system. A PARTIAL index keeps it
     * tiny forever: once a row is published it leaves the index, so the
     * sweeper's poll stays O(backlog) rather than O(table).
     */
    index("outbox_unpublished").on(t.id).where(sql`${t.publishedAt} IS NULL`),
    index("outbox_aggregate_idx").on(t.aggregateType, t.aggregateId),
  ],
);

/* -------------------------------------------------------------------------
 * audit_log — append-only
 * ---------------------------------------------------------------------- */

/**
 * §7.3 #4: the application role is granted INSERT only on this table.
 * No UPDATE, no DELETE. That grant is part of the migration, not a convention
 * somebody has to remember.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    actorId: uuid("actor_id").references(() => appUser.id),
    /** 'system' when a job rather than a person made the change. */
    actorLabel: text("actor_label").notNull().default("system"),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_created_brin").using("brin", t.createdAt),
  ],
);

/* -------------------------------------------------------------------------
 * redirect — SEO continuity
 * ---------------------------------------------------------------------- */

/**
 * HLD.md §5 Layer 2 / §10 risk 1: the existing URLs ARE the asset. This table
 * is the source of truth; it is compiled out to edge KV so a redirect costs no
 * origin hop and survives an app outage.
 */
export const redirect = pgTable(
  "redirect",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromPath: text("from_path").notNull().unique(),
    toPath: text("to_path").notNull(),
    statusCode: integer("status_code").notNull().default(301),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("redirect_from_idx").on(t.fromPath)],
);
