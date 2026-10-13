/**
 * GET /api/cron/[job] — Vercel Cron and GitHub Actions target.
 *
 * Three schedulers drive this (HLD-FREE-TIER.md §3.3), because Vercel Hobby
 * cron runs once a day with up to 59 minutes of slop:
 *
 *   outbox-sweep   QStash Schedules   every 15 min
 *   lead-probe     GitHub Actions     every 15 min
 *   maintenance    Vercel Cron        03:00 daily
 *   guardrails     Vercel Cron        03:30 daily
 *
 * Guarded by CRON_SECRET rather than a signature, since the callers are
 * heterogeneous. GET so a scheduler can hit it without a body.
 */
import type { NextRequest } from "next/server";

import { UnauthorizedError, type Logger } from "@/core";
import { container } from "@/lib/container";
import { bearerToken, json, problem, secretsMatch } from "@/lib/http";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CronHandler = (logger: Logger) => Promise<Record<string, unknown>>;

/** Gated sweep — the Redis flag decides whether Postgres is woken at all. */
const sweep: CronHandler = async () => {
  const report = await container.outboxSweeper().sweep();
  return { ...report };
};

/**
 * The guardrail report (§7). One message a day carrying the numbers that
 * decide whether anything is about to break — the point is to know before
 * the client does.
 */
const guardrails: CronHandler = async (logger) => {
  const outbox = container.outboxRepo();
  const leads = container.leadRepo();

  const since = new Date(Date.now() - 24 * 3_600_000);
  const [backlog, stuck, leadsToday] = await Promise.all([
    outbox.countUnpublished(),
    outbox.countStuck(60, 3),
    leads.countSince(since),
  ]);

  const alarms: string[] = [];
  // Silent form failure is invisible, and therefore the most expensive bug
  // available here. Zero leads in a day is worth a human looking.
  if (leadsToday === 0) alarms.push("No leads in the last 24h");
  if (stuck > 0) alarms.push(`${stuck} outbox events stuck (>60m, >=3 attempts)`);
  if (backlog > 100) alarms.push(`Outbox backlog is ${backlog}`);

  const report = { backlog, stuck, leadsToday, alarms };

  await container.notifier().broadcast({
    audience: "sales",
    subject: alarms.length ? "⚠ Guardrail alarm" : "Daily guardrail report",
    body: [
      `Leads (24h):      ${leadsToday}`,
      `Outbox backlog:   ${backlog}`,
      `Stuck events:     ${stuck}`,
      alarms.length ? `\nALARMS:\n- ${alarms.join("\n- ")}` : "\nAll clear.",
    ].join("\n"),
  });

  logger.log(alarms.length ? "warn" : "info", "guardrail report", report);
  return report;
};

/**
 * Nightly maintenance. Pruning keeps the 1 GB Neon budget honest (§4.3);
 * a forced sweep guarantees a lost Redis flag cannot strand the queue.
 */
const maintenance: CronHandler = async (logger) => {
  const pruned = await container.outboxRepo().prunePublished(30);
  const swept = await container.outboxSweeper().sweep(100, true);
  /*
    Expired sessions are already unusable — resolveSession has the expiry in
    its predicate — so this is housekeeping against the 1 GB budget rather
    than a security control, which is why it rides the nightly job instead of
    earning a schedule of its own.
  */
  const sessions = await container.accountService().purgeExpiredSessions();
  logger.log("info", "nightly maintenance complete", { pruned, swept, sessions });
  return { prunedOutboxRows: pruned, sweep: swept, expiredSessions: sessions };
};

const HANDLERS: Record<string, CronHandler> = {
  "outbox-sweep": sweep,
  guardrails,
  maintenance,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> },
) {
  const { job } = await params;
  const log = container.logger().child({ route: "GET /api/cron", job });

  try {
    if (!secretsMatch(bearerToken(request), env.CRON_SECRET)) {
      throw new UnauthorizedError("Invalid or missing cron secret");
    }

    const handler = HANDLERS[job];
    if (!handler) {
      return json({ error: { code: "unknown_job", message: `No such job '${job}'` } }, 404);
    }

    return json({ job, ...(await handler(log)) }, 200);
  } catch (error) {
    return problem(error, log);
  }
}
