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
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
    /** scrypt, encoded as `scrypt$N$r$p$salt$hash`. Never a plaintext column. */
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
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
