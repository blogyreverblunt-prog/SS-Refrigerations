import { defineConfig } from "drizzle-kit";

/**
 * Migrations are generated from src/db/schema and CHECKED IN
 * (HLD-FREE-TIER.md §5.1). `push` is for a scratch branch only; the
 * deployed path is always a reviewed migration file.
 */
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
