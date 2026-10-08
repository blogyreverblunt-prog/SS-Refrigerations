/**
 * A small, closed hierarchy of domain errors.
 *
 * Why a hierarchy rather than throwing strings: the HTTP layer must map a
 * failure to a status code WITHOUT knowing which module produced it. Every
 * error below carries its own `status` and `code`, so `toHttpProblem()` is a
 * single function with no switch over module internals — add a new error
 * subclass and the transport keeps working unchanged (Open/Closed).
 */

export abstract class DomainError extends Error {
  /** HTTP status this failure maps to at the edge. */
  abstract readonly status: number;
  /** Stable machine-readable code. Safe to expose to a client. */
  abstract readonly code: string;

  protected constructor(
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

/** Input failed validation. Carries field-level issues for the form to render. */
export class ValidationError extends DomainError {
  readonly status = 422;
  readonly code = "validation_failed";

  constructor(
    message = "The submitted data is not valid",
    readonly issues: readonly { path: string; message: string }[] = [],
  ) {
    super(message, { issues });
  }
}

/** The caller is going too fast. `retryAfterSeconds` drives the Retry-After header. */
export class RateLimitError extends DomainError {
  readonly status = 429;
  readonly code = "rate_limited";

  constructor(readonly retryAfterSeconds: number) {
    super("Too many requests", { retryAfterSeconds });
  }
}

/** Bot defence rejected the submission. */
export class CaptchaError extends DomainError {
  readonly status = 400;
  readonly code = "captcha_failed";

  constructor(message = "Could not verify that you are human") {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly status = 404;
  readonly code = "not_found";

  constructor(entity: string, identifier: string) {
    super(`${entity} '${identifier}' was not found`, { entity, identifier });
  }
}

export class UnauthorizedError extends DomainError {
  readonly status = 401;
  readonly code = "unauthorized";

  constructor(message = "Authentication is required") {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = "forbidden";

  constructor(message = "You do not have access to this resource") {
    super(message);
  }
}

/**
 * A capability the deployment has not been given. Distinct from a bug: it
 * means an env var is absent, and the operator — not the developer — fixes it.
 */
export class NotConfiguredError extends DomainError {
  readonly status = 503;
  readonly code = "not_configured";

  constructor(capability: string, requiredVars: readonly string[] = []) {
    super(
      `The '${capability}' capability is not configured for this deployment`,
      { capability, requiredVars },
    );
  }
}

/** A third party failed. Retryable by definition — the outbox will cope. */
export class UpstreamError extends DomainError {
  readonly status = 502;
  readonly code = "upstream_failed";

  constructor(
    readonly service: string,
    message: string,
    // `override`: Error already declares `cause`. Narrowing it here is
    // intentional, so TypeScript wants the modifier to prove it is not a
    // name collision by accident.
    override readonly cause?: unknown,
  ) {
    super(`${service}: ${message}`, { service });
  }
}

/* -------------------------------------------------------------------------
 * Transport mapping
 * ---------------------------------------------------------------------- */

export interface HttpProblem {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/**
 * Map any thrown value to a safe HTTP payload.
 *
 * An unknown error is deliberately flattened to a generic 500: internal
 * messages can leak schema names, file paths and query fragments, and none of
 * that belongs in a response body.
 */
export function toHttpProblem(error: unknown): HttpProblem {
  if (error instanceof DomainError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    };
  }
  return {
    status: 500,
    code: "internal_error",
    message: "Something went wrong on our side.",
  };
}
