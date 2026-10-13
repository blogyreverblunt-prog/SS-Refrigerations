/**
 * GET /api/auth/google — start the Google sign-in handshake.
 *
 * A GET that redirects, because it is reached by a link rather than a form:
 * the browser leaves this site entirely and comes back at the callback.
 *
 * Two short-lived cookies go out with the redirect and are read exactly once
 * when it returns:
 *
 *   · `g_state`    — matched against the `state` Google echoes back. This is
 *                    what makes a forged callback useless, so it is httpOnly
 *                    and SameSite=Lax (not Strict: the callback IS a
 *                    cross-site navigation, and Strict would withhold the
 *                    cookie at precisely the moment it is needed).
 *   · `g_verifier` — the PKCE verifier, which never leaves this origin.
 *
 * Ten minutes, because that is longer than anyone takes to pick an account
 * and short enough that an abandoned attempt leaves nothing behind.
 */
import { NextResponse, type NextRequest } from "next/server";

import { capabilities, env } from "@/lib/env";
import {
  G_HANDSHAKE_TTL_SECONDS,
  G_NEXT_COOKIE,
  G_STATE_COOKIE,
  G_VERIFIER_COOKIE,
  startGoogleSignIn,
} from "@/modules/accounts";

/*
  Only handlers and Next's own config names may be exported from a route
  module — exporting the cookie names from here is a build error, which is why
  they live in the accounts module.
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const home = new URL("/login", env.APP_URL);

  // Not configured: behave as though the button does not exist, because on a
  // correctly rendered page it does not.
  if (!capabilities.google) {
    home.searchParams.set("error", "google_unavailable");
    return NextResponse.redirect(home);
  }

  const { url, state, codeVerifier } = startGoogleSignIn();

  /*
    Where to land afterwards, carried in a cookie rather than in `state`.
    Google echoes `state` back verbatim, so anything put in it is attacker-
    controllable on the way home; a cookie set by this origin is not.
  */
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  const response = NextResponse.redirect(url);
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    maxAge: G_HANDSHAKE_TTL_SECONDS,
  };

  response.cookies.set({ name: G_STATE_COOKIE, value: state, ...options });
  response.cookies.set({ name: G_VERIFIER_COOKIE, value: codeVerifier, ...options });
  response.cookies.set({ name: G_NEXT_COOKIE, value: safeNext, ...options });

  return response;
}
