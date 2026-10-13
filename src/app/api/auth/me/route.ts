/**
 * GET /api/auth/me — who, if anyone, is signed in.
 *
 * This endpoint exists so the header can stay static. Every marketing page on
 * this site is prerendered (HLD.md: pages read the database at build or
 * revalidation, never per visitor), and reading a cookie in the header
 * component would opt all of them out of that in one edit. Instead the header
 * ships as "Sign in", and a small client component asks this route after
 * hydration and swaps in the name if there is one.
 *
 * Anonymous is 200 with `{ customer: null }`, not 401: not being signed in is
 * the ordinary case here, not a failure, and a 401 in the console on every
 * page load trains people to ignore the console.
 */
import type { NextRequest } from "next/server";

import { container } from "@/lib/container";
import { json, problem } from "@/lib/http";
import { SESSION_COOKIE } from "@/modules/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const log = container.logger().child({ route: "GET /api/auth/me" });

  try {
    const who = await container
      .accountService()
      .current(request.cookies.get(SESSION_COOKIE)?.value);

    return json(
      {
        customer: who
          ? { id: who.id, name: who.name, email: who.email, company: who.company }
          : null,
      },
      200,
      // A per-visitor answer must never be stored by a shared cache.
      { "cache-control": "private, no-store" },
    );
  } catch (error) {
    return problem(error, log);
  }
}
