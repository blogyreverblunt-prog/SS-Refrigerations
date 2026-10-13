/**
 * Bounded context: ACCOUNTS
 *
 * Answers HLD.md §12 open question 1 — "authentication becomes a v1 concern"
 * — with the smallest thing that can carry a payment later. A customer
 * account is optional: nothing on this site is behind it today, and the
 * catalogue, the downloads and every enquiry form keep working for somebody
 * who never registers. It exists so that when checkout arrives there is
 * already a party to attach an order to.
 *
 * ## Why this is not `app_user`
 *
 * `app_user` in platform.ts is three staff members on an Auth.js magic link,
 * with roles that grant publishing rights. A customer is a different kind of
 * thing with a different lifecycle: self-registered, unverified until they
 * prove an address, numerous, and never granted a scope inside the admin.
 * Putting both in one table means one `role` column deciding whether a row
 * can publish the website — which is the shape of mistake that turns a
 * leaked customer password into an editor session.
 *
 * ## Why the session token is stored hashed
 *
 * `customer_session.token_hash` holds SHA-256 of the value in the cookie,
 * never the value itself. A dump of this table is then useless for
 * impersonation, which is the same reasoning `lead.ip_hash` already follows.
 * Sessions are rows rather than a signed stateless token because logout has
 * to actually revoke — a JWT cannot be withdrawn before it expires, and
 * "sign out everywhere" is a thing people ask for after a shared laptop.
 */
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { bytea, citext } from "../types";

export const CUSTOMER_STATUS = ["active", "suspended"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUS)[number];

export const customer = pgTable(
  "customer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * citext, so Rahul@example.com and rahul@example.com cannot both register.
     * The unique index is the real guard; the service lowercases anyway.
     */
    email: citext("email").notNull().unique(),
    /**
     * scrypt, encoded as `scrypt$N$r$p$salt$hash`. Never a plaintext column.
     *
     * NULLABLE, because an account created through Google has no password and
     * never will unless its owner sets one. A placeholder hash would be worse
     * than a null: it is a value that looks like a credential, and any code
     * that forgot to check the provider would happily verify against it. Null
     * cannot be verified against by accident — `verifyPassword` is never
     * reached without one.
     */
    passwordHash: text("password_hash"),
    name: text("name").notNull(),
    /**
     * Avatar URL, which today only Google supplies.
     *
     * A URL rather than bytes: it is Google's CDN, it changes when the person
     * changes their photo, and copying it into R2 would mean serving a stale
     * face forever. Null is the ordinary case — anyone who registered with an
     * email has no picture — and the UI falls back to initials.
     */
    image: text("image"),
    /** E.164, same normalisation the lead forms apply. */
    phone: text("phone"),
    company: text("company"),
    /**
     * Null until the address is proven. Nothing enforces it yet: registration
     * is not gated on it, because an unverified account that can still read
     * its own quotes is more useful than a dead-end "check your email" page
     * with no mail flow behind it. Payments are where this starts to matter.
     */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [index("customer_created_idx").on(t.createdAt.desc())],
);

/**
 * One row per external account a customer can sign in with.
 *
 * A separate table rather than a `google_sub` column on `customer`, for the
 * reason that column would have to be joined by a second one the day a second
 * provider appears — and because the thing being modelled is genuinely a
 * many-to-one: one person, several ways in. It also keeps `customer` free of
 * provider vocabulary.
 *
 * `providerAccountId` is the provider's immutable subject id — Google's `sub`
 * — and never the email address. People change their email; `sub` is the only
 * value Google guarantees is stable and unique, and matching on anything else
 * is how one person ends up with two accounts or, far worse, two people end
 * up sharing one.
 */
export const customerIdentity = pgTable(
  "customer_identity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    /** "google" today. Kept as text so adding one is data, not a migration. */
    provider: text("provider").notNull(),
    /** Google's `sub`. Opaque, stable, and never reused. */
    providerAccountId: text("provider_account_id").notNull(),
    /** The address the provider asserted at link time, for support questions. */
    email: citext("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => [
    /** The lookup every sign-in does, and the guard against a double link. */
    uniqueIndex("customer_identity_provider_account_idx").on(
      t.provider,
      t.providerAccountId,
    ),
    index("customer_identity_customer_idx").on(t.customerId),
  ],
);

export const customerSession = pgTable(
  "customer_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    /** SHA-256 of the cookie value. The cookie value itself is never stored. */
    tokenHash: bytea("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Moved forward on use, so an idle session can be expired separately. */
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    /** HMAC'd, like lead.ip_hash. A raw address is never written. */
    ipHash: bytea("ip_hash"),
  },
  (t) => [
    index("customer_session_customer_idx").on(t.customerId),
    /** Drives the expiry sweep; see AccountRepository.purgeExpiredSessions. */
    index("customer_session_expires_idx").on(t.expiresAt),
  ],
);

/** Rows older than this are deleted by the sweep rather than merely rejected. */
export const SESSION_TTL_DAYS = 30;
