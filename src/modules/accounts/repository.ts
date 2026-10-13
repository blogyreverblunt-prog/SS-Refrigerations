/**
 * Persistence for the accounts context.
 *
 * Rows in, rows out. No hashing, no rate limiting, no cookie — those live in
 * the service, which is what lets the service be exercised against an
 * in-memory fake of the port below with no database at all.
 */
import { and, eq, gt, lt } from "drizzle-orm";

import { db, dbRead } from "@/lib/db";
import {
  customer,
  customerIdentity,
  customerSession,
  type CustomerStatus,
} from "@/db/schema";

export interface CustomerRecord {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly company: string | null;
  readonly status: CustomerStatus;
  readonly emailVerifiedAt: Date | null;
  readonly createdAt: Date;
  /** Avatar URL, from Google. Null for anyone who registered with a password. */
  readonly image: string | null;
}

export interface CustomerWithSecret extends CustomerRecord {
  /** Null for an account created through Google, which has no password. */
  readonly passwordHash: string | null;
}

export interface CreateCustomerCommand {
  readonly email: string;
  /** Null creates an account that can only be signed into through a provider. */
  readonly passwordHash: string | null;
  readonly name: string;
  readonly phone?: string | undefined;
  readonly company?: string | undefined;
  readonly image?: string | null;
  /** Set when a provider asserts the address is verified. */
  readonly emailVerifiedAt?: Date | null;
}

/** One external account, as the provider describes it. */
export interface ProviderIdentity {
  /** "google". */
  readonly provider: string;
  /** The provider's immutable subject id — never the email address. */
  readonly providerAccountId: string;
  readonly email?: string | null;
}

export interface CreateSessionCommand {
  readonly customerId: string;
  readonly tokenHash: Buffer;
  readonly expiresAt: Date;
  readonly userAgent?: string | null;
  readonly ipHash?: Buffer | null;
}

export interface ResolvedSession {
  readonly sessionId: string;
  readonly customer: CustomerRecord;
}

export interface AccountRepositoryPort {
  emailTaken(email: string): Promise<boolean>;
  create(command: CreateCustomerCommand): Promise<CustomerRecord>;
  findByEmail(email: string): Promise<CustomerWithSecret | null>;
  markLoggedIn(customerId: string): Promise<void>;
  updatePasswordHash(customerId: string, passwordHash: string): Promise<void>;
  /** The lookup a provider sign-in starts with. */
  findByProviderAccount(
    provider: string,
    providerAccountId: string,
  ): Promise<CustomerRecord | null>;
  /** Idempotent: re-signing in with the same Google account relinks nothing. */
  linkIdentity(customerId: string, identity: ProviderIdentity): Promise<void>;
  /** Keeps the avatar and display name current with the provider. */
  updateProfileFromProvider(
    customerId: string,
    patch: { name?: string; image?: string | null },
  ): Promise<void>;
  createSession(command: CreateSessionCommand): Promise<void>;
  resolveSession(tokenHash: Buffer, now: Date): Promise<ResolvedSession | null>;
  deleteSession(tokenHash: Buffer): Promise<void>;
  deleteSessionsFor(customerId: string): Promise<void>;
  purgeExpiredSessions(now: Date): Promise<number>;
}

const PUBLIC_COLUMNS = {
  id: customer.id,
  email: customer.email,
  name: customer.name,
  phone: customer.phone,
  company: customer.company,
  status: customer.status,
  emailVerifiedAt: customer.emailVerifiedAt,
  createdAt: customer.createdAt,
  image: customer.image,
} as const;

export class AccountRepository implements AccountRepositoryPort {
  async emailTaken(email: string): Promise<boolean> {
    const [row] = await dbRead()
      .select({ id: customer.id })
      .from(customer)
      .where(eq(customer.email, email))
      .limit(1);
    return Boolean(row);
  }

  /**
   * Relies on the unique index rather than on the check above.
   *
   * `emailTaken` is there to produce a good field-level message; it is not a
   * guard, because two registrations arriving together both pass it. The
   * constraint is what actually decides, and the service translates the
   * violation into the same message.
   */
  async create(command: CreateCustomerCommand): Promise<CustomerRecord> {
    const [row] = await db()
      .insert(customer)
      .values({
        email: command.email,
        passwordHash: command.passwordHash,
        name: command.name,
        phone: command.phone ?? null,
        company: command.company ?? null,
        image: command.image ?? null,
        emailVerifiedAt: command.emailVerifiedAt ?? null,
      })
      .returning(PUBLIC_COLUMNS);
    if (!row) throw new Error("customer insert returned no row");
    return toRecord(row);
  }

  async findByEmail(email: string): Promise<CustomerWithSecret | null> {
    const [row] = await dbRead()
      .select({ ...PUBLIC_COLUMNS, passwordHash: customer.passwordHash })
      .from(customer)
      .where(eq(customer.email, email))
      .limit(1);
    return row ? { ...toRecord(row), passwordHash: row.passwordHash } : null;
  }

  async markLoggedIn(customerId: string): Promise<void> {
    await db()
      .update(customer)
      .set({ lastLoginAt: new Date() })
      .where(eq(customer.id, customerId));
  }

  async updatePasswordHash(customerId: string, passwordHash: string): Promise<void> {
    await db().update(customer).set({ passwordHash }).where(eq(customer.id, customerId));
  }

  async findByProviderAccount(
    provider: string,
    providerAccountId: string,
  ): Promise<CustomerRecord | null> {
    const [row] = await dbRead()
      .select(PUBLIC_COLUMNS)
      .from(customerIdentity)
      .innerJoin(customer, eq(customer.id, customerIdentity.customerId))
      .where(
        and(
          eq(customerIdentity.provider, provider),
          eq(customerIdentity.providerAccountId, providerAccountId),
        ),
      )
      .limit(1);
    return row ? toRecord(row) : null;
  }

  /**
   * Upsert on (provider, provider_account_id) — the unique index. Signing in
   * again with the same Google account therefore touches `last_used_at` and
   * writes nothing else, and two sign-ins racing cannot produce two links.
   */
  async linkIdentity(customerId: string, identity: ProviderIdentity): Promise<void> {
    await db()
      .insert(customerIdentity)
      .values({
        customerId,
        provider: identity.provider,
        providerAccountId: identity.providerAccountId,
        email: identity.email ?? null,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [customerIdentity.provider, customerIdentity.providerAccountId],
        set: { lastUsedAt: new Date(), email: identity.email ?? null },
      });
  }

  /**
   * Only ever widens what we hold: a name is not overwritten with an empty
   * one, and a picture is not cleared because Google happened to omit it.
   */
  async updateProfileFromProvider(
    customerId: string,
    patch: { name?: string; image?: string | null },
  ): Promise<void> {
    const set: { name?: string; image?: string } = {};
    if (patch.name?.trim()) set.name = patch.name.trim();
    if (patch.image) set.image = patch.image;
    if (Object.keys(set).length === 0) return;

    await db().update(customer).set(set).where(eq(customer.id, customerId));
  }

  async createSession(command: CreateSessionCommand): Promise<void> {
    await db().insert(customerSession).values({
      customerId: command.customerId,
      tokenHash: command.tokenHash,
      expiresAt: command.expiresAt,
      userAgent: command.userAgent ?? null,
      ipHash: command.ipHash ?? null,
    });
  }

  /**
   * One join, and the expiry is part of the predicate rather than checked
   * afterwards — an expired row must not be distinguishable from a missing
   * one by how long the answer takes.
   */
  async resolveSession(tokenHash: Buffer, now: Date): Promise<ResolvedSession | null> {
    const [row] = await dbRead()
      .select({ sessionId: customerSession.id, ...PUBLIC_COLUMNS })
      .from(customerSession)
      .innerJoin(customer, eq(customer.id, customerSession.customerId))
      .where(
        and(
          eq(customerSession.tokenHash, tokenHash),
          gt(customerSession.expiresAt, now),
          eq(customer.status, "active"),
        ),
      )
      .limit(1);
    if (!row) return null;

    // Fire-and-forget: a failed touch must not fail the request it rode in on.
    void db()
      .update(customerSession)
      .set({ lastSeenAt: now })
      .where(eq(customerSession.id, row.sessionId))
      .catch(() => {});

    return { sessionId: row.sessionId, customer: toRecord(row) };
  }

  async deleteSession(tokenHash: Buffer): Promise<void> {
    await db().delete(customerSession).where(eq(customerSession.tokenHash, tokenHash));
  }

  async deleteSessionsFor(customerId: string): Promise<void> {
    await db().delete(customerSession).where(eq(customerSession.customerId, customerId));
  }

  /** Swept by the cron route; the index on `expires_at` is what makes it cheap. */
  async purgeExpiredSessions(now: Date): Promise<number> {
    const rows = await db()
      .delete(customerSession)
      .where(lt(customerSession.expiresAt, now))
      .returning({ id: customerSession.id });
    return rows.length;
  }
}

/** Narrows the stored `status` text back to its union. */
function toRecord(row: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  image: string | null;
}): CustomerRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    company: row.company,
    status: row.status === "suspended" ? "suspended" : "active",
    emailVerifiedAt: row.emailVerifiedAt,
    createdAt: row.createdAt,
    image: row.image,
  };
}

/** Postgres' unique-violation SQLSTATE, which is how a duplicate email arrives. */
export const UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}
