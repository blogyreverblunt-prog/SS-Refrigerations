/**
 * GET /api/health — liveness plus a capability report.
 *
 * Deliberately reports WHICH integrations are configured. On a design where
 * every integration is optional and degrades, "which ones are live in this
 * deployment" is the first question during an incident.
 *
 * It reports booleans only. Never echo a credential, not even a prefix.
 */
import { container } from "@/lib/container";
import { capabilities } from "@/lib/env";
import { json, problem } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const log = container.logger().child({ route: "GET /api/health" });
  try {
    return json({
      status: "ok",
      time: new Date().toISOString(),
      capabilities: {
        storage: capabilities.storage,
        queue: capabilities.queue,
        queueSignature: capabilities.queueSignature,
        redis: capabilities.redis,
        mail: capabilities.mail,
        telegram: capabilities.telegram,
        whatsapp: capabilities.whatsapp,
        turnstile: capabilities.turnstile,
        // Reported separately so a half-configured pair is visible. A
        // deployment with the secret but no site key rejects every lead.
        turnstileSecret: capabilities.turnstileSecret,
        turnstileWidget: capabilities.turnstileWidget,
      },
      notificationChannels: container.notifier().registered(),
    });
  } catch (error) {
    return problem(error, log);
  }
}
