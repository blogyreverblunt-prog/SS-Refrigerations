/**
 * Bounded context: CONTENT  (HLD.md §7.2)
 *
 * §7.3 #4: content is VERSIONED. `content_revision` keeps a full JSONB
 * snapshot per publish rather than a diff — at ~20 publishes a week the
 * storage is free, and "restore exactly what was live on the morning of the
 * expo" becomes a one-row operation instead of a replay.
 *
 * Marketing copy that never changes structurally lives in MDX in git, not
 * here (HLD-FREE-TIER.md §5.3). Only STRUCTURED content needs the database.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { geography } from "../types";
import { industry } from "./catalog";
import { appUser } from "./platform";

/* -------------------------------------------------------------------------
 * revisions — one table serves every versioned entity
 * ---------------------------------------------------------------------- */

export const contentRevision = pgTable(
  "content_revision",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 'product' | 'news_post' | 'installation' | 'page' … */
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    version: integer("version").notNull(),
    /** Full snapshot, not a diff. Rollback = publish the previous row. */
    snapshot: jsonb("snapshot").notNull(),
    authorId: uuid("author_id").references(() => appUser.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("revision_entity_version").on(t.entityType, t.entityId, t.version),
    index("revision_created_brin").using("brin", t.createdAt),
  ],
);

/* -------------------------------------------------------------------------
 * news
 * ---------------------------------------------------------------------- */

export const newsPost = pgTable(
  "news_post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    /** Array overlap queries are served by the GIN index below. */
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    heroAssetKey: text("hero_asset_key"),
    status: text("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("news_status_valid", sql`${t.status} IN ('draft','live','archived')`),
    index("news_tags_gin").using("gin", t.tags),
    index("news_published_brin").using("brin", t.publishedAt),
  ],
);

/* -------------------------------------------------------------------------
 * installations — the trust asset the audit found nobody builds
 * ---------------------------------------------------------------------- */

export const installation = pgTable(
  "installation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    clientName: text("client_name").notNull(),
    city: text("city"),
    industryId: uuid("industry_id").references(() => industry.id, { onDelete: "set null" }),
    summary: text("summary"),
    /** PostGIS point — powers radius and nearest-neighbour on the map. */
    geo: geography("geo"),
    status: text("status").notNull().default("draft"),
    commissionedOn: timestamp("commissioned_on", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("installation_status_valid", sql`${t.status} IN ('draft','live','archived')`),
    index("installation_geo_gist").using("gist", t.geo),
    index("installation_industry_idx").on(t.industryId),
  ],
);

/* -------------------------------------------------------------------------
 * careers
 * ---------------------------------------------------------------------- */

export const job = pgTable(
  "job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    department: text("department"),
    location: text("location"),
    employmentType: text("employment_type"),
    description: text("description"),
    status: text("status").notNull().default("draft"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
  },
  (t) => [check("job_status_valid", sql`${t.status} IN ('draft','live','archived')`)],
);

/**
 * Like `lead`, an application is immutable demand: never edited in place.
 * The CV is a storage key — the file goes to R2, is AV-scanned, and the row
 * is deleted on a 12-month lifecycle rule to satisfy DPDP retention.
 */
export const jobApplication = pgTable(
  "job_application",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => job.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    cvStorageKey: text("cv_storage_key"),
    message: text("message"),
    status: text("status").notNull().default("new"),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("application_job_idx").on(t.jobId, t.createdAt.desc()),
    index("application_created_brin").using("brin", t.createdAt),
  ],
);
