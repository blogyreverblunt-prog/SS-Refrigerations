/**
 * POST /api/auth/logout — revoke this session.
 *
 * POST, not GET: a GET that signs you out can be fired by an <img> tag on
 * another site, and a prefetcher will happily follow it.
 *
 * Always 204, even with no cookie or a stale one. Signing out is idempotent,
 * and an error here would only tell somebody whether the token they hold is
 * still live.
 */
import type { NextRequest } from "next/server";

import { container } from "@/lib/container";
import { problem } from "@/lib/http";
import { clearedSessionCookie, SESSION_COOKIE } from "@/modules/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const log = container.logger().child({ route: "POST /api/auth/logout" });

  try {
    await container.accountService().logout(request.cookies.get(SESSION_COOKIE)?.value);

    const response = new Response(null, { status: 204 });
    // The row is gone; this is what stops the browser sending the dead token
    // back on every subsequent request.
    const cleared = clearedSessionCookie();
    response.headers.append(
      "set-cookie",
      `${cleared.name}=; Path=${cleared.path}; Max-Age=0; HttpOnly; SameSite=Lax${
        cleared.secure ? "; Secure" : ""
      }`,
    );
    return response;
  } catch (error) {
    return problem(error, log);
  }
}
