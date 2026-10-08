/**
 * GET /api/catalog — a read endpoint to prove the data layer end to end.
 *
 * Exists so the backend can be exercised before any UI does. It returns the
 * category tree plus live products for one category, which between them
 * touch the GiST ltree index and the `product_live_idx` partial index — the
 * two reads the catalogue actually depends on.
 *
 *   /api/catalog                        → all categories
 *   /api/catalog?category=deep-freezer  → + live products in it
 *   /api/catalog?product=deep-freezer   → full product detail
 */
import type { NextRequest } from "next/server";

import { container } from "@/lib/container";
import { json, problem } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const log = container.logger().child({ route: "GET /api/catalog" });
  const repo = container.catalogRepo();
  const params = request.nextUrl.searchParams;

  try {
    const productSlug = params.get("product");
    if (productSlug) {
      return json(await repo.findProductBySlug(productSlug));
    }

    const categorySlug = params.get("category");
    const categories = await repo.listCategories();

    if (categorySlug) {
      return json({
        categories,
        products: await repo.listLiveProducts(categorySlug),
      });
    }

    return json({ categories, count: categories.length });
  } catch (error) {
    return problem(error, log);
  }
}
