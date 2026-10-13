/**
 * Registration, sign-in, sign-out, and "who is this".
 *
 * ## The account is optional, and that is the design
 *
 * Nothing on this site is behind it. The catalogue, the downloads and every
 * enquiry form work for somebody who never registers, and no route redirects
 * an anonymous visitor anywhere. An account exists so that there is a party
 * to attach an order to when checkout arrives — which is why registration
 * asks for a name, an email and a password and nothing else. Address and GST
 * details belong to the order, not to the sign-up form, and asking for them
 * now would cost registrations to collect data that will be stale by the time
 * it is used.
 *
 * ## What sign-in does not tell an attacker
 *
 * A wrong password and an unknown email produce the same message, the same
 * status and — because the hash is computed either way — roughly the same
 * timing. Registration is the one place that cannot hide it: telling somebody
 * their email is already registered is the only way they can act on it, and
 * the address is already recoverable through any password-reset flow.
 */
import { createHmac } from "node:crypto";

import { RateLimitError, UnauthorizedError, ValidationError } from "@/core";
import type { Clock, Logger, RateLimiterPort } from "@/core";
import { env } from "@/lib/env";

import { hashPassword, needsRehash, verifyPassword } from "./password";
import {
  isUniqueViolation,
  type AccountRepositoryPort,
  type CustomerRecord,
} from "./repository";
import {
  loginInputSchema,
  registerInputSchema,
  type AuthRequestContext,
} from "./schema";
import { hashSessionToken, mintSession, SESSION_TTL_SECONDS } from "./session";

export interface AccountServiceDeps {
  readonly repository: AccountRepositoryPort;
  readonly rateLimiter: RateLimiterPort;
  readonly clock: Clock;
  readonly logger: Logger;
}

export interface SignedIn {
  readonly customer: CustomerRecord;
  /** Belongs in a cookie, and nowhere else. */
  readonly token: string;
  readonly maxAge: number;
}

export class AccountService {
  constructor(private readonly deps: AccountServiceDeps) {}

  async register(raw: unknown, context: AuthRequestContext): Promise<SignedIn> {
    const parsed = registerInputSchema.safeParse(raw);
    if (!parsed.success) throw toValidationError(parsed.error);
    const input = parsed.data;

    // A filled hidden field is a bot. Succeed quietly rather than explain.
    if (input.website) {
      this.deps.logger.log("info", "honeypot triggered on registration");
      throw new ValidationError("That email is already registered", [
        { path: "email", message: "That email is already registered" },
      ]);
    }

    await this.enforceRateLimit(context.ip, "register");

    if (await this.deps.repository.emailTaken(input.email)) {
      throw emailTakenError();
    }

    const passwordHash = await hashPassword(input.password);

    let created: CustomerRecord;
    try {
      created = await this.deps.repository.create({
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        company: input.company,
      });
    } catch (error) {
      // Two registrations for one address arriving together: the index decides.
      if (isUniqueViolation(error)) throw emailTakenError();
      throw error;
    }

    this.deps.logger.log("info", "customer registered", { customerId: created.id });
    return this.startSession(created, context);
  }

  async login(raw: unknown, context: AuthRequestContext): Promise<SignedIn> {
    const parsed = loginInputSchema.safeParse(raw);
    if (!parsed.success) throw toValidationError(parsed.error);
    const input = parsed.data;

    await this.enforceRateLimit(context.ip, "login");

    const found = await this.deps.repository.findByEmail(input.email);

    /*
      The hash is computed even when there is no such customer.

      Returning early would make an unknown address answer in a millisecond
      and a known one in forty, which turns this endpoint into a way to
      enumerate who has an account here. Hashing against a throwaway value
      costs the same as the real path and removes the signal.
    */
    const encoded = found?.passwordHash ?? DUMMY_HASH;
    const ok = await verifyPassword(input.password, encoded);

    if (!found || !ok || found.status !== "active") {
      this.deps.logger.log("info", "sign-in rejected");
      throw new UnauthorizedError("Those details do not match an account");
    }

    // Raised cost parameters apply on the next successful sign-in, which is
    // the only moment the plaintext is available to rehash with.
    if (needsRehash(found.passwordHash)) {
      const upgraded = await hashPassword(input.password);
      await this.deps.repository.updatePasswordHash(found.id, upgraded);
    }

    await this.deps.repository.markLoggedIn(found.id);
    return this.startSession(found, context);
  }

  /** Idempotent: signing out twice, or with a stale cookie, is not an error. */
  async logout(token: string | null | undefined): Promise<void> {
    if (!token) return;
    await this.deps.repository.deleteSession(hashSessionToken(token));
  }

  /** Every session for this customer — the "sign out everywhere" case. */
  async logoutEverywhere(customerId: string): Promise<void> {
    await this.deps.repository.deleteSessionsFor(customerId);
  }

  /**
   * Resolves the cookie to a customer, or null. Never throws on a bad token:
   * an unreadable cookie means anonymous, which every caller already handles.
   */
  async current(token: string | null | undefined): Promise<CustomerRecord | null> {
    if (!token) return null;
    const resolved = await this.deps.repository.resolveSession(
      hashSessionToken(token),
      this.deps.clock.now(),
    );
    return resolved?.customer ?? null;
  }

  async purgeExpiredSessions(): Promise<number> {
    return this.deps.repository.purgeExpiredSessions(this.deps.clock.now());
  }

  private async startSession(
    who: CustomerRecord,
    context: AuthRequestContext,
  ): Promise<SignedIn> {
    const { token, tokenHash } = mintSession();
    const expiresAt = new Date(this.deps.clock.now().getTime() + SESSION_TTL_SECONDS * 1000);

    await this.deps.repository.createSession({
      customerId: who.id,
      tokenHash,
      expiresAt,
      userAgent: context.userAgent?.slice(0, 400) ?? null,
      ipHash: this.hashIp(context.ip),
    });

    return { customer: who, token, maxAge: SESSION_TTL_SECONDS };
  }

  /**
   * Per-IP, and the bucket name is part of the key so a burst of
   * registrations cannot exhaust somebody else's sign-in allowance.
   */
  private async enforceRateLimit(ip: string | null, bucket: string): Promise<void> {
    const verdict = await this.deps.rateLimiter.check(`auth:${bucket}:${ip ?? "unknown"}`);
    if (!verdict.allowed) throw new RateLimitError(verdict.retryAfterSeconds);
  }

  /** Same HMAC the lead path uses, so a raw address is never stored. */
  private hashIp(ip: string | null): Buffer | null {
    if (!ip) return null;
    return createHmac("sha256", env.LEAD_IP_HASH_SALT).update(ip).digest();
  }
}

/**
 * A real scrypt string that no password produces, for the unknown-email path.
 *
 * Generated once with the current parameters so verifying against it costs
 * what verifying a genuine hash costs.
 */
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" +
  "c2NyeXB0LWR1bW15LXZhbHVlLXRoYXQtbm8tcGFzc3dvcmQtd2lsbC1ldmVyLW1hdGNoLXh4eHh4eHh4eHg=";

function emailTakenError(): ValidationError {
  return new ValidationError("That email is already registered", [
    { path: "email", message: "That email is already registered — sign in instead" },
  ]);
}

function toValidationError(error: {
  issues: readonly { path: readonly (string | number)[]; message: string }[];
}): ValidationError {
  return new ValidationError(
    "Check the highlighted fields",
    error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  );
}
