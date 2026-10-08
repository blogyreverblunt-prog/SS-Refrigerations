/**
 * Catalog reads.
 *
 * These are the queries behind the ISR-rendered pages, so they run at most
 * once per publish rather than once per visitor — which is the only reason a
 * 100 CU-hour Neon budget is survivable (HLD-FREE-TIER.md §4.1). Treat every
 * method here as "runs at build or revalidation time", never "runs per
 * request".
 */
import { and, asc, eq, sql } from "drizzle-orm";

import { NotFoundError } from "@/core";
import { dbRead } from "@/lib/db";
import {
  asset,
  category,
  document,
  product,
  productVariant,
  type PublishStatus,
} from "@/db/schema";

export interface CategoryNode {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly path: string;
  readonly sortOrder: number;
}

export interface ProductListItem {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly series: string | null;
  readonly summary: string | null;
}

export interface ProductDetail extends ProductListItem {
  readonly categoryId: string;
  readonly specs: unknown;
  readonly status: PublishStatus;
  readonly version: number;
  readonly variants: readonly VariantRow[];
  readonly assets: readonly AssetRow[];
  readonly documents: readonly DocumentRow[];
}

export interface VariantRow {
  readonly id: string;
  readonly modelCode: string;
  readonly capacityL: string | null;
  readonly tempMinC: string | null;
  readonly tempMaxC: string | null;
  readonly refrigerant: string | null;
  readonly powerW: number | null;
  readonly dimsMm: unknown;
  /** NULL until pricing is switched on. See the pricing seam. */
  readonly mrpInr: string | null;
}

export interface AssetRow {
  readonly id: string;
  readonly storageKey: string;
  readonly alt: string | null;
  readonly kind: string;
  readonly variants: unknown;
}

export interface DocumentRow {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly storageKey: string;
}

export interface CatalogRepositoryPort {
  listCategories(): Promise<CategoryNode[]>;
  listLive(limit: number): Promise<ProductListItem[]>;
  breadcrumb(path: string): Promise<CategoryNode[]>;
  subtree(path: string): Promise<CategoryNode[]>;
  listLiveProducts(categorySlug: string): Promise<ProductListItem[]>;
  findProductBySlug(slug: string): Promise<ProductDetail>;
  liveProductSlugs(): Promise<{ slug: string; categorySlug: string }[]>;
}

export class CatalogRepository implements CatalogRepositoryPort {
  async listCategories(): Promise<CategoryNode[]> {
    return dbRead()
      .select({
        id: category.id,
        slug: category.slug,
        name: category.name,
        path: category.path,
        sortOrder: category.sortOrder,
      })
      .from(category)
      .orderBy(asc(category.sortOrder), asc(category.name));
  }

  /**
   * Live products across every category, for the home page rails.
   * Served by `product_live_idx`, the same partial index the category
   * listing uses.
   */
  async listLive(limit: number): Promise<ProductListItem[]> {
    return dbRead()
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        series: product.series,
        summary: product.summary,
      })
      .from(product)
      .where(eq(product.status, "live"))
      .orderBy(asc(product.sortOrder), asc(product.name))
      .limit(limit);
  }

  /**
   * Ancestors of a path — the breadcrumb — in ONE index scan.
   * `@>` means "is an ancestor of", served by the GiST index. A recursive
   * CTE would also work and would be a loop instead of a scan.
   */
  async breadcrumb(path: string): Promise<CategoryNode[]> {
    return dbRead()
      .select({
        id: category.id,
        slug: category.slug,
        name: category.name,
        path: category.path,
        sortOrder: category.sortOrder,
      })
      .from(category)
      .where(sql`${category.path} @> ${path}::ltree`)
      .orderBy(sql`nlevel(${category.path})`);
  }

  /** Descendants — the range landing page. `<@` is "is a descendant of". */
  async subtree(path: string): Promise<CategoryNode[]> {
    return dbRead()
      .select({
        id: category.id,
        slug: category.slug,
        name: category.name,
        path: category.path,
        sortOrder: category.sortOrder,
      })
      .from(category)
      .where(sql`${category.path} <@ ${path}::ltree`)
      .orderBy(asc(category.sortOrder));
  }

  /** Served by the partial index `product_live_idx`. The hot read path. */
  async listLiveProducts(categorySlug: string): Promise<ProductListItem[]> {
    return dbRead()
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        series: product.series,
        summary: product.summary,
      })
      .from(product)
      .innerJoin(category, eq(product.categoryId, category.id))
      .where(and(eq(category.slug, categorySlug), eq(product.status, "live")))
      .orderBy(asc(product.sortOrder), asc(product.name));
  }

  /**
   * The product detail page in four queries rather than one join.
   *
   * A single join across variants, assets and documents would multiply rows
   * (3 variants x 6 assets x 4 docs = 72 rows for one product) and then need
   * de-duplicating in JS. Four small indexed queries move less data and are
   * easier to read.
   */
  async findProductBySlug(slug: string): Promise<ProductDetail> {
    const [row] = await dbRead()
      .select()
      .from(product)
      .where(eq(product.slug, slug))
      .limit(1);

    if (!row) throw new NotFoundError("Product", slug);

    const [variants, assets, documents] = await Promise.all([
      dbRead()
        .select({
          id: productVariant.id,
          modelCode: productVariant.modelCode,
          capacityL: productVariant.capacityL,
          tempMinC: productVariant.tempMinC,
          tempMaxC: productVariant.tempMaxC,
          refrigerant: productVariant.refrigerant,
          powerW: productVariant.powerW,
          dimsMm: productVariant.dimsMm,
          mrpInr: productVariant.mrpInr,
        })
        .from(productVariant)
        .where(eq(productVariant.productId, row.id))
        .orderBy(asc(productVariant.sortOrder), asc(productVariant.modelCode)),

      dbRead()
        .select({
          id: asset.id,
          storageKey: asset.storageKey,
          alt: asset.alt,
          kind: asset.kind,
          variants: asset.variants,
        })
        .from(asset)
        .where(eq(asset.productId, row.id))
        .orderBy(asc(asset.sortOrder)),

      dbRead()
        .select({
          id: document.id,
          kind: document.kind,
          title: document.title,
          storageKey: document.storageKey,
        })
        .from(document)
        .where(eq(document.productId, row.id)),
    ]);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      series: row.series,
      summary: row.summary,
      categoryId: row.categoryId,
      specs: row.specs,
      status: row.status as PublishStatus,
      version: row.version,
      variants,
      assets,
      documents,
    };
  }

  /** Drives generateStaticParams and the sitemap. */
  async liveProductSlugs(): Promise<{ slug: string; categorySlug: string }[]> {
    return dbRead()
      .select({ slug: product.slug, categorySlug: category.slug })
      .from(product)
      .innerJoin(category, eq(product.categoryId, category.id))
      .where(eq(product.status, "live"));
  }
}
