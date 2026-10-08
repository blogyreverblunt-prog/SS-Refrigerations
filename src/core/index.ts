/**
 * The core barrel. Pure abstractions and tiny default implementations only —
 * nothing in here may import a vendor SDK, a database client, or a module.
 * If something here needed `drizzle-orm`, it would belong in `lib/` instead.
 */
import type { Clock, IdGenerator, LogFields, Logger, LogLevel } from "./ports";

export * from "./errors";
export * from "./ports";

/* -------------------------------------------------------------------------
 * Default ambient implementations
 * ---------------------------------------------------------------------- */

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Freezes time. Exists so date-sensitive logic can be tested deterministically. */
export class FixedClock implements Clock {
  constructor(private instant: Date) {}

  now(): Date {
    return new Date(this.instant);
  }

  advance(ms: number): void {
    this.instant = new Date(this.instant.getTime() + ms);
  }
}

export class CryptoIdGenerator implements IdGenerator {
  uuid(): string {
    return crypto.randomUUID();
  }
}

/**
 * Structured JSON logger.
 *
 * One line per event, because Vercel Hobby keeps logs for one hour and the
 * only way to reconstruct an incident afterwards is to have shipped something
 * machine-parseable to Sentry/Axiom (seam 14).
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly bindings: LogFields = {}) {}

  log(level: LogLevel, message: string, fields: LogFields = {}): void {
    const line = JSON.stringify({
      level,
      message,
      time: new Date().toISOString(),
      ...this.bindings,
      ...fields,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  child(bindings: LogFields): Logger {
    return new ConsoleLogger({ ...this.bindings, ...bindings });
  }
}

/* -------------------------------------------------------------------------
 * Result — for expected failures
 * ---------------------------------------------------------------------- */

/**
 * Used where a failure is an ordinary outcome rather than an exception:
 * "this notification channel declined" is not a crash. Genuine faults still
 * throw a DomainError.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Run a promise, converting a rejection into an Err instead of a throw. */
export async function attempt<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(error);
  }
}
