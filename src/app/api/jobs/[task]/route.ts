/**
 * POST /api/jobs/[task] — the QStash delivery target.
 *
 * Signature-verified, idempotent, and bounded by the 60-second function cap
 * on the free tier. Every handler below must be safe to run twice: QStash is
 * at-least-once, and the sweeper can re-deliver an event whose ack was lost.
 *
 * Adding a task means adding an entry to HANDLERS. The route itself never
 * changes (Open/Closed).
 */
import type { NextRequest } from "next/server";

import { JOB_TASKS, UpstreamError, type JobTask, type Logger } from "@/core";
import { container } from "@/lib/container";
import { json, problem } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Hobby caps at 60s; staying under it is a design constraint, not a hope. */
export const maxDuration = 60;

interface JobContext {
  readonly payload: Record<string, unknown>;
  readonly logger: Logger;
}

type JobHandler = (ctx: JobContext) => Promise<Record<string, unknown>>;

/* -------------------------------------------------------------------------
 * Handlers
 * ---------------------------------------------------------------------- */

/**
 * Notify on a new lead. Sales first — that is the one that carries revenue —
 * then the customer acknowledgement through whichever channel is permitted.
 */
const leadNotify: JobHandler = async ({ payload, logger }) => {
  const leadId = String(payload.leadId ?? "");
  if (!leadId) throw new UpstreamError("job", "lead-notify received no leadId");

  const lead = await container.leadRepo().findById(leadId);
  const items = await container.leadRepo().itemsFor(leadId);
  const notifier = container.notifier();

  const lines = [
    `Ref:     ${lead.ref}`,
    `Type:    ${lead.type}`,
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    lead.phone ? `Phone:   ${lead.phone}` : null,
    lead.company ? `Company: ${lead.company}` : null,
    lead.city ? `City:    ${lead.city}` : null,
    items.length ? `Items:   ${items.length}` : null,
    lead.message ? `\n${lead.message}` : null,
  ].filter(Boolean) as string[];

  // Broadcast, not first-wins: a missed RFQ costs more than a duplicate ping.
  const sales = await notifier.broadcast({
    audience: "sales",
    subject: `New ${lead.type} — ${lead.ref}`,
    body: lines.join("\n"),
  });

  const ack = await notifier.dispatch({
    audience: "customer",
    subject: `We have your enquiry (${lead.ref})`,
    body:
      `Hi ${lead.name},\n\n` +
      `Thank you for contacting us. Your reference is ${lead.ref}. ` +
      `A member of our team will be in touch shortly.`,
    recipient: {
      email: lead.email,
      phone: lead.phone ?? undefined,
      // Conservative default: the free WhatsApp window only counts when we
      // know the customer opened it. Wiring that signal is a later task.
      whatsappWindowOpen: false,
    },
  });

  logger.log("info", "lead notifications dispatched", {
    ref: lead.ref,
    salesVia: sales.via,
    ackVia: ack.via,
  });

  return { ref: lead.ref, salesDelivered: sales.delivered, ackDelivered: ack.delivered };
};

/** Forced drain, used when QStash re-delivers a sweep schedule. */
const outboxSweep: JobHandler = async () => {
  const report = await container.outboxSweeper().sweep(50, true);
  return { ...report };
};

const notImplemented =
  (task: string): JobHandler =>
  async ({ logger }) => {
    logger.log("warn", "job handler not implemented yet", { task });
    return { skipped: true, task };
  };

const HANDLERS: Record<JobTask, JobHandler> = {
  "lead-notify": leadNotify,
  "outbox-sweep": outboxSweep,
  "media-derive": notImplemented("media-derive"),
  "search-reindex": notImplemented("search-reindex"),
  purge: notImplemented("purge"),
};

function isJobTask(value: string): value is JobTask {
  return (JOB_TASKS as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------
 * Route
 * ---------------------------------------------------------------------- */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ task: string }> },
) {
  const { task } = await params;
  const log = container.logger().child({ route: "POST /api/jobs", task });

  try {
    // Read the body as text first: signature verification is over the exact
    // bytes, so parsing before verifying would break it.
    const raw = await request.text();

    await container
      .queueVerifier()
      .verify(request.headers.get("upstash-signature"), raw, request.url);

    if (!isJobTask(task)) {
      return json({ error: { code: "unknown_task", message: `No such job '${task}'` } }, 404);
    }

    const payload = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
    const result = await HANDLERS[task]({ payload, logger: log });

    return json({ task, ...result }, 200);
  } catch (error) {
    // A non-2xx tells QStash to retry, which is what we want for a transient
    // upstream failure. Its DLQ catches anything that keeps failing.
    return problem(error, log);
  }
}
