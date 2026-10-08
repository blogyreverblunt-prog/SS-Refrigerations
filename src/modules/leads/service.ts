/**
 * LeadService — the revenue path.  HLD.md §6.1.
 *
 *   1  POST with an Idempotency-Key          (collapses double-clicks)
 *   2  Turnstile + honeypot + per-IP bucket
 *   3  Validate, normalise, hash the IP      (abuse detection only)
 *   4  ONE transaction: lead + lead_item[] + outbox('lead.created')
 *   5  202 with the lead_ref                 (user sees success in < 300 ms)
 *   6  Worker drains the outbox
 *   7  Provider down? The row is in the outbox. Sweeper collects it.
 *
 * THE DATABASE COMMIT IS THE DURABILITY BOUNDARY, and no third party sits on
 * the user's request path. A SaaS outage delays notification; it never loses
 * the lead.
 *
 * Every collaborator arrives through the constructor as an interface. The
 * service has never heard of Turnstile, Upstash or QStash, which is why the
 * whole nine-step path can be exercised in a unit test with fakes.
 */
import { createHmac } from "node:crypto";

import { RateLimitError, ValidationError } from "@/core";
import type { CachePort, CaptchaVerifierPort, Clock, Logger, RateLimiterPort } from "@/core";
import { withTransaction } from "@/lib/db";
import { env } from "@/lib/env";
import type { OutboxPublisher, OutboxRepositoryPort } from "@/modules/outbox";

import { leadInputSchema, type LeadInput, type LeadRequestContext } from "./schema";
import type { LeadReferenceGenerator } from "./reference";
import type { LeadRepositoryPort } from "./repository";

export interface LeadAccepted {
  readonly ref: string;
  readonly id: string;
  /** True when an identical Idempotency-Key was already processed. */
  readonly duplicate: boolean;
}

/** How long a lead reference is replayable for the same key. */
const IDEMPOTENCY_TTL_SECONDS = 86_400;

/** Postgres unique_violation. */
const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

export interface LeadServiceDeps {
  readonly leads: LeadRepositoryPort;
  readonly outbox: OutboxRepositoryPort;
  readonly publisher: OutboxPublisher;
  readonly captcha: CaptchaVerifierPort;
  readonly rateLimiter: RateLimiterPort;
  readonly cache: CachePort;
  readonly references: LeadReferenceGenerator;
  readonly clock: Clock;
  readonly logger: Logger;
}

export class LeadService {
  constructor(private readonly deps: LeadServiceDeps) {}

  async submit(raw: unknown, context: LeadRequestContext): Promise<LeadAccepted> {
    const input = this.parse(raw);

    // Honeypot: a filled hidden field is a bot. Return a plausible success
    // rather than an error, so the bot has nothing to tune against.
    if (input.website) {
      this.deps.logger.log("info", "honeypot triggered; discarding", {
        ip: this.hashIp(context.ip)?.toString("hex").slice(0, 12),
      });
      // A plausible-looking reference, NOT drawn from the sequence: bots
      // must not be able to burn real reference numbers, and the gaps
      // would otherwise show up in the sales desk's numbering.
      const year = this.deps.clock.now().getUTCFullYear();
      const fake = String(Math.floor(Math.random() * 90_000) + 10_000);
      return { ref: `KLT-${year}-${fake}`, id: "discarded", duplicate: false };
    }

    const ipHash = this.hashIp(context.ip);

    await this.enforceRateLimit(ipHash, context.ip);
    await this.deps.captcha.verify(input.captchaToken ?? null, context.ip ?? undefined);

    const replay = await this.checkIdempotency(context.idempotencyKey);
    if (replay) return replay;

    const accepted = await this.persist(input, ipHash, context.idempotencyKey);
    if (accepted.duplicate) {
      return { ref: accepted.ref, id: accepted.id, duplicate: true };
    }

    await this.rememberIdempotency(context.idempotencyKey, accepted);

    // Step 6. Deliberately after the commit and deliberately un-awaited for
    // correctness, not speed: its failure must not reach the caller.
    await this.deps.publisher.dispatch("lead-notify", accepted.outboxId, {
      leadId: accepted.id,
      ref: accepted.ref,
      eventType: "lead.created",
    });

    this.deps.logger.log("info", "lead accepted", {
      ref: accepted.ref,
      type: input.type,
      items: input.items.length,
    });

    return { ref: accepted.ref, id: accepted.id, duplicate: false };
  }

  /* --------------------------------------------------------------------
   * Steps, each small enough to read in one sitting
   * ------------------------------------------------------------------ */

  private parse(raw: unknown): LeadInput {
    const result = leadInputSchema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError(
        "Please check the highlighted fields",
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }

  /**
   * DPDP: the raw IP is never stored. HMAC with a server-side salt keeps the
   * same visitor detectable for abuse scoring while making the value useless
   * to anyone who obtains the database. Rotating the salt breaks the linkage
   * deliberately.
   */
  private hashIp(ip: string | null): Buffer | null {
    if (!ip) return null;
    return createHmac("sha256", env.LEAD_IP_HASH_SALT).update(ip).digest();
  }

  private async enforceRateLimit(ipHash: Buffer | null, ip: string | null): Promise<void> {
    if (!ip) return;
    const identifier = ipHash ? ipHash.toString("hex") : ip;
    const verdict = await this.deps.rateLimiter.check(identifier);
    if (!verdict.allowed) {
      throw new RateLimitError(verdict.retryAfterSeconds);
    }
  }

  /**
   * Step 1. A double-click, a flaky network retry and an over-eager mobile
   * browser all produce the same request twice. Replaying the original
   * reference is the only answer that does not create a duplicate enquiry
   * for the sales desk to dedupe by hand.
   */
  private async checkIdempotency(key: string | null): Promise<LeadAccepted | null> {
    if (!key) return null;

    // Fast path: Redis, when it exists. Saves a database round trip on what
    // is overwhelmingly the common case (a genuine double-click, seconds
    // apart).
    const seen = await this.deps.cache.get<string>(this.idempotencyKey(key));
    if (seen) {
      const [ref, id] = seen.split("|");
      if (ref && id) return { ref, id, duplicate: true };
    }

    // Authoritative path. Redis is optional in this design; the database is
    // not, so the guarantee has to be able to live here.
    const existing = await this.deps.leads.findByIdempotencyKey(key);
    return existing ? { ...existing, duplicate: true } : null;
  }

  private async rememberIdempotency(
    key: string | null,
    accepted: { ref: string; id: string },
  ): Promise<void> {
    if (!key) return;
    await this.deps.cache.set(
      this.idempotencyKey(key),
      `${accepted.ref}|${accepted.id}`,
      IDEMPOTENCY_TTL_SECONDS,
    );
  }

  private idempotencyKey(key: string): string {
    return `lead:idem:${key}`;
  }

  /**
   * Step 4 — the only part that must be atomic.
   *
   * The reference is drawn BEFORE the transaction opens: `nextval` is not
   * rolled back anyway, and holding the sequence call inside the transaction
   * would lengthen it for no benefit. A gap in the reference series after a
   * failed insert is acceptable; a duplicate reference is not.
   */
  private async persist(
    input: LeadInput,
    ipHash: Buffer | null,
    idempotencyKey: string | null,
  ): Promise<{ id: string; ref: string; outboxId: bigint; duplicate: boolean }> {
    const ref = await this.deps.references.next();
    const consentAt = this.deps.clock.now();

    try {
      return await withTransaction(async (tx) => {
        const row = await this.deps.leads.insert(tx, {
          ref,
          type: input.type,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          city: input.city,
          message: input.message,
          source: input.source,
          consentAt,
          ipHash,
          idempotencyKey: idempotencyKey ?? undefined,
          items: input.items,
        });

        const outboxId = await this.deps.outbox.enqueue(tx, {
          aggregateType: "lead",
          aggregateId: row.id,
          eventType: "lead.created",
          payload: { leadId: row.id, ref: row.ref, type: input.type },
        });

        return { ...row, outboxId, duplicate: false };
      });
    } catch (error) {
      /**
       * Two requests with the same key can pass `checkIdempotency`
       * together and both reach the insert. The partial unique index makes
       * the database the arbiter: exactly one commits, the other gets
       * 23505 and resolves to the winner's reference.
       *
       * This is the only correct place to settle that race — a check-then-
       * write in application code cannot.
       */
      if (idempotencyKey && isUniqueViolation(error)) {
        const winner = await this.deps.leads.findByIdempotencyKey(idempotencyKey);
        if (winner) {
          this.deps.logger.log("info", "idempotent replay resolved by unique index", {
            ref: winner.ref,
          });
          return { ...winner, outboxId: 0n, duplicate: true };
        }
      }
      throw error;
    }
  }
}
