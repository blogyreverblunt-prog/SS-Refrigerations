/**
 * http.ts — the transport edge.
 *
 * Route handlers stay thin (HLD-FREE-TIER.md §5.1: "ROUTES ONLY. Thin. No
 * business logic, no SQL."). Everything repetitive about turning a domain
 * outcome into a Response lives here, once.
 */
import { NextResponse } from "next/server";

import { RateLimitError, toHttpProblem } from "@/core";
import type { Logger } from "@/core";

export function json<T>(body: T, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(body, { status, headers });
}

/**
 * Render any thrown value as a safe response.
 *
 * A DomainError carries its own status and a message intended for a user.
 * Anything else becomes a generic 500 and is logged in full — internal
 * messages leak schema and query fragments and must not reach a client.
 */
export function problem(error: unknown, logger: Logger): NextResponse {
  const p = toHttpProblem(error);

  if (p.status >= 500) {
    logger.log("error", "unhandled failure", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.log("info", "request rejected", { code: p.code, status: p.status });
  }

  const headers: Record<string, string> = {};
  if (error instanceof RateLimitError) {
    headers["retry-after"] = String(error.retryAfterSeconds);
  }

  return NextResponse.json(
    { error: { code: p.code, message: p.message, ...(p.details ?? {}) } },
    { status: p.status, headers },
  );
}

/**
 * Best-effort client IP.
 *
 * Trusts the platform's forwarding headers, which is correct behind Vercel
 * or Cloudflare and wrong if the app is ever exposed directly — worth
 * remembering before moving hosts.
 */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip");
}

/**
 * Constant-time comparison for shared secrets.
 *
 * `a === b` on a secret leaks its prefix through timing. These are short
 * strings over a fast network so it is a modest risk, but the fix is three
 * lines.
 */
export function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/** Reads `Authorization: Bearer <token>`, falling back to `?secret=`. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return new URL(request.url).searchParams.get("secret");
}
