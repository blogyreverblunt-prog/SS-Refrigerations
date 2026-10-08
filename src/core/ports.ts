/**
 * ports.ts — the Dependency Inversion layer.
 *
 * Every interface here is owned by the DOMAIN, not by the vendor that happens
 * to implement it today. `modules/leads` depends on `QueuePort`; it has never
 * heard of QStash. That is the whole mechanism behind the scaling-seams map in
 * HLD-FREE-TIER.md §6 — swapping QStash for SQS means writing one new class
 * that satisfies `QueuePort` and changing one line in the composition root.
 *
 * The interfaces are kept deliberately small (Interface Segregation): a
 * consumer that only needs to enqueue takes `QueuePort` and is not forced to
 * know about signature verification, which lives in `QueueVerifierPort`.
 */

/* -------------------------------------------------------------------------
 * Ambient capabilities
 * ---------------------------------------------------------------------- */

/** Injected so time-dependent logic is testable without faking globals. */
export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  uuid(): string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Readonly<Record<string, unknown>>;

export interface Logger {
  log(level: LogLevel, message: string, fields?: LogFields): void;
  child(bindings: LogFields): Logger;
}

/* -------------------------------------------------------------------------
 * Object storage  (seam 2)
 * ---------------------------------------------------------------------- */

export interface StoredObject {
  readonly key: string;
  readonly size: number;
  readonly contentType: string;
}

export interface StoragePort {
  /** Direct server-side upload. Used by jobs, not by browsers. */
  put(
    key: string,
    body: Uint8Array | Buffer,
    contentType: string,
  ): Promise<StoredObject>;

  /**
   * Pre-signed PUT so a browser uploads straight to storage, keeping the
   * bytes off the function and off the host's bandwidth quota.
   */
  signedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  /** Pre-signed GET for private objects such as CVs. */
  signedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /** Stable public URL for CDN-served objects. No signature, no expiry. */
  publicUrl(key: string): string;

  delete(key: string): Promise<void>;
}

/* -------------------------------------------------------------------------
 * Queue  (seam 6)
 * ---------------------------------------------------------------------- */

/** The task names the system knows how to run. */
export const JOB_TASKS = [
  "lead-notify",
  "media-derive",
  "search-reindex",
  "outbox-sweep",
  "purge",
] as const;
export type JobTask = (typeof JOB_TASKS)[number];

export interface QueuePort {
  /**
   * Enqueue a task. Implementations MUST NOT throw on transport failure —
   * the caller has already committed its business row and the sweeper is the
   * backstop. Return false instead, so the caller can log and move on.
   */
  publish(task: JobTask, payload: unknown): Promise<boolean>;
}

/** Separate from QueuePort: only the inbound route handler needs this. */
export interface QueueVerifierPort {
  /** Throws UnauthorizedError when the signature does not check out. */
  verify(signature: string | null, rawBody: string, url: string): Promise<void>;
}

/* -------------------------------------------------------------------------
 * Cache + rate limiting  (seam 9)
 * ---------------------------------------------------------------------- */

export interface CachePort {
  /**
   * Whether a real cache is behind this port.
   *
   * Callers need to tell "the cache says no" apart from "there is no
   * cache". A null from `get` means both, and conflating them is how an
   * optimisation turns into a silent outage — the outbox sweeper is gated
   * on a cache flag, so a missing cache must mean "run anyway", not
   * "nothing to do".
   */
  readonly available: boolean;

  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  /** Atomic set-if-absent. Underpins idempotency keys and the sweeper gate. */
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean>;
}

export interface RateLimitVerdict {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

export interface RateLimiterPort {
  check(identifier: string): Promise<RateLimitVerdict>;
}

/* -------------------------------------------------------------------------
 * Outbound messaging  (seam 11)
 * ---------------------------------------------------------------------- */

export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
  readonly replyTo?: string;
}

export interface MailPort {
  send(message: MailMessage): Promise<void>;
}

/**
 * One notification channel. The set of channels is OPEN — adding SMS means
 * adding a class, never editing a switch statement somewhere (Open/Closed).
 */
export interface NotificationChannel {
  /** Stable identifier used in logs and in the registry. */
  readonly name: string;

  /**
   * Whether this channel can serve this notification right now. Covers both
   * "is it configured" and policy, e.g. WhatsApp can only send a free-form
   * reply inside a 24-hour window the customer opened.
   */
  canHandle(notification: Notification): boolean;

  send(notification: Notification): Promise<void>;
}

export type NotificationAudience = "sales" | "customer";

export interface Notification {
  readonly audience: NotificationAudience;
  readonly subject: string;
  readonly body: string;
  readonly html?: string;
  /** Present for customer-facing notifications. */
  readonly recipient?: {
    readonly email?: string;
    readonly phone?: string;
    /** True when the customer messaged first and the free window is open. */
    readonly whatsappWindowOpen?: boolean;
  };
  readonly meta?: Readonly<Record<string, unknown>>;
}

/* -------------------------------------------------------------------------
 * Bot defence
 * ---------------------------------------------------------------------- */

export interface CaptchaVerifierPort {
  /** Throws CaptchaError on failure. */
  verify(token: string | null, remoteIp?: string): Promise<void>;
}
