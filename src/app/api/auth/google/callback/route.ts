/**
 * GET /api/auth/google/callback — where Google sends the browser back.
 *
 * Every failure redirects to /login with a short code in the query string and
 * says nothing more. The visitor cannot act on "redirect_uri_mismatch" and an
 * attacker should not be handed a description of what went wrong; the detail
 * goes to the log, where somebody can do something about it.
 *
 * The three handshake cookies are cleared on every path out of here,
 * including the failures. A state value that survives its attempt is a state
 * value that can be replayed.
 */
import { NextResponse, type NextRequest } from "next/server";

import { container } from "@/lib/container";
import { clientIp } from "@/lib/http";
import { capabilities, env } from "@/lib/env";
import {
  G_NEXT_COOKIE,
  G_STATE_COOKIE,
  G_VERIFIER_COOKIE,
  exchangeGoogleCode,
  sessionCookie,
} from "@/modules/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(reason: string): NextResponse {
  const url = new URL("/login", env.APP_URL);
  url.searchParams.set("error", reason);
  return clear(NextResponse.redirect(url));
}

/** The handshake cookies are single-use, whatever the outcome. */
function clear(response: NextResponse): NextResponse {
  for (const name of [G_STATE_COOKIE, G_VERIFIER_COOKIE, G_NEXT_COOKIE]) {
    response.cookies.set({ name, value: "", path: "/", maxAge: 0 });
  }
  return response;
}

export async function GET(request: NextRequest) {
  const log = container.logger().child({ route: "GET /api/auth/google/callback" });

  if (!capabilities.google) return back("google_unavailable");

  const params = request.nextUrl.searchParams;

  // The person pressed "cancel" at Google, or Google refused the request.
  const denied = params.get("error");
  if (denied) {
    log.log("info", "google sign-in cancelled or refused", { reason: denied });
    return back("google_cancelled");
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(G_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(G_VERIFIER_COOKIE)?.value;

  if (!code || !state || !expectedState || !verifier) {
    log.log("info", "google callback missing code, state or handshake cookie");
    return back("google_expired");
  }

  /*
    Constant-time is unnecessary here and length-safe equality is not: these
    are two 43-character base64url strings and the comparison leaks only
    whether they matched, which is the thing being told to the user anyway.
  */
  if (state !== expectedState) {
    log.log("warn", "google callback state mismatch");
    return back("google_state");
  }

  try {
    const profile = await exchangeGoogleCode(code, verifier);

    const signedIn = await container.accountService().signInWithGoogle(profile, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const next = request.cookies.get(G_NEXT_COOKIE)?.value;
    const destination =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

    const response = clear(NextResponse.redirect(new URL(destination, env.APP_URL)));
    response.cookies.set(sessionCookie(signedIn.token, signedIn.maxAge));
    return response;
  } catch (error) {
    // Includes the unverified-address refusal, which is a deliberate policy
    // decision rather than a fault — see AccountService.signInWithGoogle.
    log.log("error", "google sign-in failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return back("google_failed");
  }
}
