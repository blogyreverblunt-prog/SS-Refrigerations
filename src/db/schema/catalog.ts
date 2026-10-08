/**
 * Bounded context: CATALOG  (HLD.md §7.2)
 *
 * The decision this file exists to defend (§7.3 #2): the VARIANT, not the
 * product, is the unit of truth for specs. One "Reach-In Refrigerator" page,
 * many model codes. Dimensions, capacity, energy class and price belong to the
 * SKU; marketing copy belongs to the product. Collapsing the two is what forces
 * a schema rewrite the first time someone asks for a price list.
 *
 * And §7.3 #1: hybrid relational + JSONB, deliberately. The skeleton
 * (category → product → variant → asset/document) has real integrity rules, so
 * it has real foreign keys. The spec sheet does not — a blast freezer has
 * pull-down time, a wine chiller has bottle count — so it lives in
 * `product.specs` behind a GIN index, validated per category on write.
 */
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { ltree, tsvector } from "../types";

/** Lifecycle shared by every publishable entity. */
export const PUBLISH_STATUS = ["draft", "live", "archived"] as const;
export type PublishStatus = (typeof PUBLISH_STATUS)[number];

/* -------------------------------------------------------------------------
 * category
 * ---------------------------------------------------------------------- */

export const category = pgTable(
  "category",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    /**
     * Self-reference. The `AnyPgColumn` annotation breaks the circular type
     * inference Drizzle would otherwise hit on a table referencing itself.
     */
    parentId: uuid("parent_id").references((): AnyPgColumn => category.id, {
      onDelete: "restrict",
    }),
    /** Materialised path — see types.ts. */
    path: ltree("path").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    seo: jsonb("seo").notNull().default({}),
  },
  (t) => [
    // Whole breadcrumb, or an entire subtree, in one indexed query.
    index("category_path_gist").using("gist", t.path),
  ],
);

/* -------------------------------------------------------------------------
 * product
 * ---------------------------------------------------------------------- */

export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    series: text("series"),
    status: text("status").notNull().default("draft"),
    summary: text("summary"),
    /** Family-specific spec sheet. JSON-Schema validated on write. */
    specs: jsonb("specs").notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    /**
     * Generated, so it can never drift from the columns it summarises.
     * Weights: name > series > summary.
     */
    searchTsv: tsvector("search_tsv").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(series, '')), 'B') || setweight(to_tsvector('english', coalesce(summary, '')), 'C')`,
    ),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("product_status_valid", sql`${t.status} IN ('draft','live','archived')`),
    index("product_specs_gin").using("gin", sql`${t.specs} jsonb_path_ops`),
    index("product_tsv_gin").using("gin", t.searchTsv),
    // The only hot read path. Partial, so it indexes live rows and nothing else.
    index("product_live_idx")
      .on(t.categoryId, t.sortOrder)
      .where(sql`${t.status} = 'live'`),
  ],
);

/* -------------------------------------------------------------------------
 * product_variant — the SKU
 * ---------------------------------------------------------------------- */

export const productVariant = pgTable(
  "product_variant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    /** The real-world identifier a customer quotes back at you. */
    modelCode: text("model_code").notNull().unique(),
    capacityL: numeric("capacity_l"),
    gnConfig: text("gn_config"),
    tempMinC: numeric("temp_min_c"),
    tempMaxC: numeric("temp_max_c"),
    refrigerant: text("refrigerant"),
    /** Indian-climate rating. The reason a US spec sheet cannot be reused. */
    ambientMaxC: numeric("ambient_max_c").default("43"),
    powerW: integer("power_w"),
    energyClass: text("energy_class"),
    dimsMm: jsonb("dims_mm"),
    weightKg: numeric("weight_kg"),
    /**
     * Pricing seam. NULL until the business decides to publish — see the
     * site-sections report §4. Present from day one so switching pricing on
     * is a template change, not a migration.
     */
    mrpInr: numeric("mrp_inr"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    check(
      "temp_range_valid",
      sql`${t.tempMinC} IS NULL OR ${t.tempMaxC} >= ${t.tempMinC}`,
    ),
    index("variant_product_idx").on(t.productId, t.sortOrder),
  ],
);

/* -------------------------------------------------------------------------
 * industry  ·  product ↔ industry
 * ---------------------------------------------------------------------- */

export const industry = pgTable("industry", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productIndustry = pgTable(
  "product_industry",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    industryId: uuid("industry_id")
      .notNull()
      .references(() => industry.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("product_industry_pk").on(t.productId, t.industryId),
    index("product_industry_by_industry").on(t.industryId),
  ],
);

/* -------------------------------------------------------------------------
 * asset / document — §7.3 #3: bytes never go in the database
 * ---------------------------------------------------------------------- */

export const ASSET_KIND = ["image", "render", "line_drawing", "video"] as const;
export type AssetKind = (typeof ASSET_KIND)[number];

export const asset = pgTable(
  "asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => product.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariant.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull().default("image"),
    /** Object-storage key. The file is in R2; the CDN serves it. */
    storageKey: text("storage_key").notNull(),
    alt: text("alt"),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes"),
    contentType: text("content_type"),
    /** Pre-generated AVIF widths, so no runtime image optimiser is needed. */
    variants: jsonb("variants").notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("asset_kind_valid", sql`${t.kind} IN ('image','render','line_drawing','video')`),
    index("asset_product_idx").on(t.productId, t.sortOrder),
  ],
);

export const DOCUMENT_KIND = [
  "spec_sheet",
  "manual",
  "brochure",
  "catalogue",
  "certificate",
  "cad",
  "warranty",
] as const;
export type DocumentKind = (typeof DOCUMENT_KIND)[number];

/**
 * Documents are attached per RANGE wherever possible, not per SKU — that is
 * what keeps the R2 budget at ~80 PDFs instead of 700 (HLD-FREE-TIER.md §2.3).
 */
export const document = pgTable(
  "document",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => product.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => category.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    storageKey: text("storage_key").notNull(),
    bytes: integer("bytes"),
    language: text("language").notNull().default("en"),
    /** Extracted text, so the resource centre is searchable without a crawler. */
    extractedText: text("extracted_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "document_kind_valid",
      sql`${t.kind} IN ('spec_sheet','manual','brochure','catalogue','certificate','cad','warranty')`,
    ),
    index("document_product_idx").on(t.productId),
    index("document_category_idx").on(t.categoryId),
  ],
);
