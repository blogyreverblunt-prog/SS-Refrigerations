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

    /*
      An account created through Google has no password hash, so `encoded`
      above was the dummy, `ok` is false, and the request was already
      rejected. The null check here is for the compiler rather than for a
      case that can reach it.

      Raised cost parameters apply on the next successful sign-in, which is
      the only moment the plaintext is available to rehash with.
    */
    if (found.passwordHash && needsRehash(found.passwordHash)) {
      const upgraded = await hashPassword(input.password);
      await this.deps.repository.updatePasswordHash(found.id, upgraded);
    }

    await this.deps.repository.markLoggedIn(found.id);
    return this.startSession(found, context);
  }

  /**
   * Sign in with Google, having already exchanged the code for a profile.
   *
   * Three paths, and the order matters:
   *
   *   1. The Google account is already linked — sign that customer in. This
   *      is checked first and on `sub`, so it keeps working after somebody
   *      changes the email address on their Google account.
   *   2. No link, but the address is VERIFIED and matches an existing
   *      account — link it and sign in. This is the convenience that stops a
   *      person who registered with a password ending up with a second,
   *      separate account.
   *   3. Neither — create an account with no password.
   *
   * The `emailVerified` guard on path 2 is the whole security of this method.
   * Without it, anyone able to make an identity provider assert
   * "someone@yourcustomer.com" could take over that customer's account
   * without ever knowing the password. Google only reports `email_verified`
   * false for a narrow set of cases, but "narrow" is not "never", so an
   * unverified address is never allowed to match an existing row.
   */
  async signInWithGoogle(
    profile: {
      sub: string;
      email: string;
      emailVerified: boolean;
      name: string;
      picture: string | null;
    },
    context: AuthRequestContext,
  ): Promise<SignedIn> {
    await this.enforceRateLimit(context.ip, "google");

    const identity = {
      provider: "google",
      providerAccountId: profile.sub,
      email: profile.email,
    } as const;

    const linked = await this.deps.repository.findByProviderAccount("google", profile.sub);
    if (linked) {
      if (linked.status !== "active") {
        throw new UnauthorizedError("That account is not available");
      }
      await this.deps.repository.linkIdentity(linked.id, identity);
      await this.deps.repository.updateProfileFromProvider(linked.id, {
        image: profile.picture,
      });
      await this.deps.repository.markLoggedIn(linked.id);
      this.deps.logger.log("info", "google sign-in", { customerId: linked.id });
      return this.startSession({ ...linked, image: profile.picture ?? linked.image }, context);
    }

    if (profile.emailVerified) {
      const existing = await this.deps.repository.findByEmail(profile.email);
      if (existing) {
        if (existing.status !== "active") {
          throw new UnauthorizedError("That account is not available");
        }
        await this.deps.repository.linkIdentity(existing.id, identity);
        await this.deps.repository.updateProfileFromProvider(existing.id, {
          image: profile.picture,
        });
        await this.deps.repository.markLoggedIn(existing.id);
        this.deps.logger.log("info", "google linked to existing account", {
          customerId: existing.id,
        });
        return this.startSession(
          { ...existing, image: profile.picture ?? existing.image },
          context,
        );
      }
    }

    if (!profile.emailVerified) {
      // No link and an address we cannot trust: there is nothing safe to do.
      this.deps.logger.log("info", "google sign-in refused: unverified address");
      throw new UnauthorizedError(
        "Google has not verified that address. Sign in with an email and password instead",
      );
    }

    const created = await this.deps.repository.create({
      email: profile.email,
      // No password, and no placeholder standing in for one.
      passwordHash: null,
      name: profile.name,
      image: profile.picture,
      // Google asserted it, so it is verified here too.
      emailVerifiedAt: this.deps.clock.now(),
    });

    await this.deps.repository.linkIdentity(created.id, identity);
    this.deps.logger.log("info", "customer registered via google", {
      customerId: created.id,
    });

    return this.startSession(created, context);
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
