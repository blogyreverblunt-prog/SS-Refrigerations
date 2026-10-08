/**
 * POST /api/revalidate — the publish webhook.  HLD.md §6.2 step 4.
 *
 * On-demand revalidation is what lets `revalidate = false` be the default on
 * every ISR page. Time-based revalidation would be a hidden database poll
 * running forever, and on Neon Free that alone would exhaust the 100
 * CU-hour budget (HLD-FREE-TIER.md §4.1).
 *
 * Tags are per entity — `product:<id>`, `category:<id>` — so correcting one
 * spec invalidates exactly that SKU's pages. Wildcard purging would
 * cold-start the whole catalogue during the campaign you were trying to fix.
 */
import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { UnauthorizedError, ValidationError } from "@/core";
import { container } from "@/lib/container";
import { bearerToken, json, problem, secretsMatch } from "@/lib/http";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    tags: z.array(z.string().min(1).max(128)).max(50).default([]),
    paths: z.array(z.string().startsWith("/").max(512)).max(50).default([]),
  })
  .refine((v) => v.tags.length + v.paths.length > 0, {
    message: "Provide at least one tag or path to revalidate",
  });

export async function POST(request: NextRequest) {
  const log = container.logger().child({ route: "POST /api/revalidate" });

  try {
    if (!secretsMatch(bearerToken(request), env.REVALIDATE_SECRET)) {
      throw new UnauthorizedError("Invalid or missing revalidate secret");
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid revalidation request",
        parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      );
    }

    const { tags, paths } = parsed.data;
    for (const tag of tags) revalidateTag(tag);
    for (const path of paths) revalidatePath(path);

    log.log("info", "revalidated", { tags, paths });
    return json({ revalidated: true, tags, paths }, 200);
  } catch (error) {
    return problem(error, log);
  }
}
