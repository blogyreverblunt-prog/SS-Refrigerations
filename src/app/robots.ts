/**
 * robots.txt
 *
 * The one rule that matters here: allow the canonical pages, keep crawlers
 * out of the API and out of the compare permutations. `/compare?m=…` is a
 * shareable link, not a page — left crawlable it would generate one indexable
 * URL per combination of model codes and bury the product pages that actually
 * rank.
 */
import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  const base = env.APP_URL.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/compare?"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
