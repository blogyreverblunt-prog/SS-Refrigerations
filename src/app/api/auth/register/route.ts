/**
 * POST /api/auth/register — create a customer account and sign them in.
 *
 * Thin, like POST /api/leads: transport concerns out of the request, rules in
 * the module. Registering signs you in straight away because the alternative
 * — "account created, now sign in" — is a second form for a password the
 * person typed ten seconds ago.
 *
 * 201 rather than 202: unlike a lead, nothing is still in flight. The row is
 * committed and the cookie on this response is already valid.
 */
import type { NextRequest } from "next/server";

import { container } from "@/lib/container";
import { clientIp, json, problem } from "@/lib/http";
import { sessionCookie } from "@/modules/accounts";

/** Node runtime: scrypt and the IP HMAC are both node:crypto. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const log = container.logger().child({ route: "POST /api/auth/register" });

  try {
    const body: unknown = await request.json().catch(() => ({}));

    const signedIn = await container.accountService().register(body, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const response = json(
      {
        customer: {
          id: signedIn.customer.id,
          name: signedIn.customer.name,
          email: signedIn.customer.email,
        },
        message: `Welcome, ${signedIn.customer.name}.`,
      },
      201,
    );
    response.cookies.set(sessionCookie(signedIn.token, signedIn.maxAge));
    return response;
  } catch (error) {
    return problem(error, log);
  }
}
