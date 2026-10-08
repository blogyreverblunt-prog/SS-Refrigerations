/**
 * types.ts — Postgres types Drizzle does not ship out of the box.
 *
 * HLD.md §7.2 leans on ltree, citext, tsvector, bytea and PostGIS geography.
 * Each is declared once here so the schema files read like the DDL they mirror
 * and no table has to know about driver-level encoding.
 */
import { customType } from "drizzle-orm/pg-core";

/**
 * ltree — materialised path, e.g. 'commercial_refrigeration.counters.r290'.
 * Indexed with GiST so `@>` (ancestors / breadcrumb) and `<@` (descendants /
 * range landing page) are index scans rather than recursive CTEs.
 */
export const ltree = customType<{ data: string; driverData: string }>({
  dataType: () => "ltree",
});

/** citext — case-insensitive text. Used for email so uniqueness is real. */
export const citext = customType<{ data: string; driverData: string }>({
  dataType: () => "citext",
});

/**
 * tsvector — full-text search vector. Always a GENERATED column in this
 * schema, so it can never drift from the columns it summarises.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType: () => "tsvector",
});

/** bytea — raw bytes. Only used for HMAC'd IP hashes (never a raw IP). */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * PostGIS geography (WGS84). `installation.geo` uses it for the radius and
 * nearest-neighbour queries behind the installations map.
 *
 * Declared WITHOUT the `(Point, 4326)` type modifier on purpose.
 * drizzle-kit emits a custom type as a quoted identifier — `"geography"` is
 * valid, but `"geography(Point, 4326)"` is parsed as one literal type name
 * and Postgres rejects it with 42704. The modifier is therefore applied by
 * an explicit ALTER at the end of the migration, which keeps both the
 * generated DDL valid and the column fully constrained.
 */
export const geography = customType<{ data: string; driverData: string }>({
  dataType: () => "geography",
});
