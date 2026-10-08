/**
 * Seed the catalogue with the six Hoshizaki refrigeration families.
 *
 *   npm run db:seed
 *
 * Source data is public/products/_products.json — scraped from Hoshizaki's
 * own catalogue page, with the image→product mapping verified against the
 * raw HTML. Model codes and specs below are PLACEHOLDERS invented for
 * testing; Hoshizaki Global publishes no model-level data.
 *
 * Idempotent: re-running updates rather than duplicating, so it is safe to
 * run against a database that already has content.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";

import * as schema from "../src/db/schema";

const { category, industry, product, productIndustry, productVariant } = schema;

interface ProductsFile {
  categories: {
    slug: string;
    name: string;
    description: string;
    sub_types: string[];
    india_available: boolean;
  }[];
}

/** Placeholder SKUs, two per family, so variant queries have something real. */
const VARIANTS: Record<string, { modelCode: string; capacityL: number; tempMin: number; tempMax: number }[]> = {
  "reach-in-refrigerator": [
    { modelCode: "HR-78MA-S", capacityL: 1300, tempMin: 2, tempMax: 8 },
    { modelCode: "HR-128MA-S", capacityL: 1900, tempMin: 2, tempMax: 8 },
  ],
  "undercounter-refrigerator": [
    { modelCode: "RT-156MA-S", capacityL: 380, tempMin: 2, tempMax: 8 },
    { modelCode: "RT-186MA-S", capacityL: 460, tempMin: 2, tempMax: 8 },
  ],
  "glass-door-refrigerator": [
    { modelCode: "VC-600GD", capacityL: 600, tempMin: 2, tempMax: 10 },
    { modelCode: "VC-900GD", capacityL: 900, tempMin: 2, tempMax: 10 },
  ],
  "sushi-display-case": [{ modelCode: "HNC-150BE", capacityL: 120, tempMin: 4, tempMax: 10 }],
  "walk-in-refrigerator": [{ modelCode: "WK-2430-R", capacityL: 9000, tempMin: 0, tempMax: 8 }],
  "deep-freezer": [
    { modelCode: "DF-450HT", capacityL: 450, tempMin: -24, tempMax: -18 },
    { modelCode: "DF-ULT-60", capacityL: 300, tempMin: -60, tempMax: -50 },
  ],
};

const INDUSTRIES = [
  { slug: "restaurants-qsr", name: "Restaurants & QSR" },
  { slug: "bakery-patisserie", name: "Bakery & Patisserie" },
  { slug: "supermarket-retail", name: "Supermarket & Retail" },
  { slug: "hotels-institutional", name: "Hotels & Institutional" },
  { slug: "healthcare-pharma", name: "Healthcare & Pharma" },
  { slug: "icecream-dairy-beverage", name: "Ice Cream, Dairy & Beverage" },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema, casing: "snake_case" });

  try {
    const file = JSON.parse(
      await readFile(path.join(process.cwd(), "public/products/_products.json"), "utf8"),
    ) as ProductsFile;

    /* -- root category ------------------------------------------------- */
    const [root] = await db
      .insert(category)
      .values({
        slug: "commercial-refrigeration",
        name: "Commercial Refrigeration",
        path: "commercial_refrigeration",
        sortOrder: 0,
      })
      .onConflictDoUpdate({
        target: category.slug,
        set: { name: "Commercial Refrigeration" },
      })
      .returning({ id: category.id });

    if (!root) throw new Error("failed to upsert root category");
    console.log("✓ root category");

    /* -- industries ---------------------------------------------------- */
    for (const [i, ind] of INDUSTRIES.entries()) {
      await db
        .insert(industry)
        .values({ slug: ind.slug, name: ind.name, sortOrder: i })
        .onConflictDoUpdate({ target: industry.slug, set: { name: ind.name } });
    }
    console.log(`✓ ${INDUSTRIES.length} industries`);

    /* -- the six families, each a child category + one product --------- */
    let productCount = 0;
    let variantCount = 0;

    for (const [i, cat] of file.categories.entries()) {
      // ltree labels allow [A-Za-z0-9_] only, so slugs must be normalised.
      const label = cat.slug.replace(/-/g, "_");

      const [child] = await db
        .insert(category)
        .values({
          slug: cat.slug,
          parentId: root.id,
          name: cat.name,
          path: `commercial_refrigeration.${label}`,
          sortOrder: i,
          seo: { title: cat.name, description: cat.description.slice(0, 160) },
        })
        .onConflictDoUpdate({
          target: category.slug,
          set: { name: cat.name, parentId: root.id },
        })
        .returning({ id: category.id });

      if (!child) throw new Error(`failed to upsert category ${cat.slug}`);

      const [prod] = await db
        .insert(product)
        .values({
          slug: cat.slug,
          categoryId: child.id,
          name: cat.name,
          series: cat.sub_types[0] ?? null,
          // Walk-in is Japan-only, so it seeds as draft rather than live —
          // which also gives the live/draft filter something to exclude.
          status: cat.india_available ? "live" : "draft",
          summary: cat.description,
          specs: { subTypes: cat.sub_types, availableInIndia: cat.india_available },
          sortOrder: i,
          publishedAt: cat.india_available ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: product.slug,
          set: {
            name: cat.name,
            summary: cat.description,
            status: cat.india_available ? "live" : "draft",
            updatedAt: new Date(),
          },
        })
        .returning({ id: product.id });

      if (!prod) throw new Error(`failed to upsert product ${cat.slug}`);
      productCount += 1;

      for (const [j, v] of (VARIANTS[cat.slug] ?? []).entries()) {
        await db
          .insert(productVariant)
          .values({
            productId: prod.id,
            modelCode: v.modelCode,
            capacityL: String(v.capacityL),
            tempMinC: String(v.tempMin),
            tempMaxC: String(v.tempMax),
            refrigerant: v.tempMin <= -40 ? "R290" : "R600a",
            ambientMaxC: "43",
            powerW: 400 + j * 150,
            dimsMm: { w: 1200, d: 800, h: 1950 },
            // Pricing stays NULL — the seam is present, pricing is not live.
            mrpInr: null,
            sortOrder: j,
          })
          .onConflictDoUpdate({
            target: productVariant.modelCode,
            set: { capacityL: String(v.capacityL), productId: prod.id },
          });
        variantCount += 1;
      }

      // Tag every family to two industries so the join has data.
      const tags = INDUSTRIES.slice(i % 3, (i % 3) + 2);
      for (const tag of tags) {
        const [row] = await db
          .select({ id: industry.id })
          .from(industry)
          .where(eq(industry.slug, tag.slug))
          .limit(1);
        if (row) {
          await db
            .insert(productIndustry)
            .values({ productId: prod.id, industryId: row.id })
            .onConflictDoNothing();
        }
      }
    }

    console.log(`✓ ${productCount} products, ${variantCount} variants`);

    const [{ live } = { live: 0 }] = await db
      .select({ live: sql<number>`count(*)::int` })
      .from(product)
      .where(eq(product.status, "live"));

    console.log(`\nSeed complete. ${live} products are live.`);
    console.log("Try:  curl http://localhost:3000/api/catalog/categories");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
