/**
 * POST /api/leads — the one hot write endpoint.
 *
 * Thin by design. It extracts transport concerns (IP, idempotency key, body)
 * and hands them to LeadService; every rule about what a valid enquiry is
 * lives in the module, not here.
 *
 * Returns 202 Accepted rather than 201: the lead is durably committed, but
 * the notification it triggers is still in flight. 202 is the honest code
 * for "we have it, work continues".
 */
import type { NextRequest } from "next/server";

import { container } from "@/lib/container";
import { clientIp, json, problem } from "@/lib/http";

/** Node runtime: the service uses node:crypto for the IP HMAC. */
export const runtime = "nodejs";
/** Never cache a write endpoint. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const log = container.logger().child({ route: "POST /api/leads" });

  try {
    const body: unknown = await request.json().catch(() => ({}));

    const accepted = await container.leadService().submit(body, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
      idempotencyKey: request.headers.get("idempotency-key"),
    });

    return json(
      {
        ref: accepted.ref,
        message: "Thank you — your enquiry has reached us.",
        duplicate: accepted.duplicate,
      },
      202,
    );
  } catch (error) {
    return problem(error, log);
  }
}
