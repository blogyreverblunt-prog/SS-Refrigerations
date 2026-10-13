/**
 * POST /api/auth/login — exchange an email and password for a session cookie.
 *
 * Every failure here is a 401 carrying the same sentence, whatever actually
 * went wrong: unknown address, wrong password, suspended account. The service
 * hashes against a dummy value when there is no such customer so the timing
 * does not give away what the message will not.
 */
import type { NextRequest } from "next/server";

import { container } from "@/lib/container";
import { clientIp, json, problem } from "@/lib/http";
import { sessionCookie } from "@/modules/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const log = container.logger().child({ route: "POST /api/auth/login" });

  try {
    const body: unknown = await request.json().catch(() => ({}));

    const signedIn = await container.accountService().login(body, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    const response = json({
      customer: {
        id: signedIn.customer.id,
        name: signedIn.customer.name,
        email: signedIn.customer.email,
      },
    });
    response.cookies.set(sessionCookie(signedIn.token, signedIn.maxAge));
    return response;
  } catch (error) {
    return problem(error, log);
  }
}
