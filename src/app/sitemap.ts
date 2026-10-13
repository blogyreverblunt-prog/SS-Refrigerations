/**
 * sitemap.xml
 *
 * Organic search lands on a product page, not on the home page, so the
 * catalogue is the part of this file that earns its keep: every live family
 * is listed from the database rather than from a hand-maintained array that
 * will drift the first time a range is published.
 *
 * `/compare` is listed without query strings on purpose — the canonical
 * compare page is the empty one; the permutations are shareable links, not
 * pages to index.
 */
import type { MetadataRoute } from "next";

import { container } from "@/lib/container";
import { env } from "@/lib/env";

export const revalidate = false;

const STATIC: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, freq: "monthly" },
  { path: "/products", priority: 0.9, freq: "monthly" },
  { path: "/industries", priority: 0.8, freq: "yearly" },
  { path: "/support", priority: 0.8, freq: "monthly" },
  { path: "/downloads", priority: 0.7, freq: "monthly" },
  { path: "/compare", priority: 0.6, freq: "monthly" },
  { path: "/about", priority: 0.6, freq: "yearly" },
  { path: "/contact", priority: 0.7, freq: "yearly" },
  // The HTML sitemap at /sitemap is a page like any other, so it is listed
  // here too. This file is the machine version of it.
  { path: "/sitemap", priority: 0.3, freq: "monthly" },
  { path: "/privacy", priority: 0.2, freq: "yearly" },
  { path: "/cookies", priority: 0.2, freq: "yearly" },
  { path: "/terms", priority: 0.2, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL.replace(/\/$/, "");
  const now = new Date();

  const rows = await container.catalogRepo().liveProductSlugs();

  return [
    ...STATIC.map((s) => ({
      url: `${base}${s.path}`,
      lastModified: now,
      changeFrequency: s.freq,
      priority: s.priority,
    })),
    ...rows.map((r) => ({
      url: `${base}/products/${r.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
