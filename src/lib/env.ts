/**
 * env.ts — the single place the process environment is read.
 *
 * HLD-FREE-TIER.md §5.1: "zod-validated, fails the build on a missing var."
 *
 * Rules enforced here:
 *  1. No other file in the codebase may touch `process.env`. An ESLint rule
 *     (eslint.config.mjs) makes that a build error, so there is exactly one
 *     place to look when a deployment is misconfigured.
 *  2. Validation is LAZY. Importing this module is free; the first property
 *     read triggers one validation pass whose result is memoised. That keeps
 *     `next build` working on a machine that has no credentials while still
 *     failing loudly the moment the server actually needs one.
 *  3. Integrations are OPTIONAL by design. A missing Telegram token must not
 *     crash the lead path — it must disable the Telegram channel and let the
 *     notification registry fall through to the next one. Only the things the
 *     app genuinely cannot run without are required.
 */
import { z } from "zod";

/* -------------------------------------------------------------------------
 * Schema
 * ---------------------------------------------------------------------- */

const bool = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /** Public origin, used for absolute URLs in callbacks and sitemaps. */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /* -- data: the only hard requirement ---------------------------------- */
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required — the Neon pooled connection string"),
  /** Seam 5. When present, read-only queries are routed here. */
  DATABASE_URL_RO: z.string().optional(),

  /* -- object storage: Cloudflare R2 over the S3 API (seam 2) ----------- */
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  /** e.g. https://cdn.example.com — what the browser fetches media from. */
  R2_PUBLIC_BASE_URL: z.string().url().optional(),

  /* -- queue: Upstash QStash (seam 6) ----------------------------------- */
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  /* -- cache + rate limit: Upstash Redis (seam 9) ----------------------- */
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  /* -- notification channels (seam 11) ---------------------------------- */
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("KALT <noreply@example.com>"),
  SALES_INBOX: z.string().email().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),

  /* -- abuse defence ----------------------------------------------------- */
  TURNSTILE_SECRET_KEY: z.string().optional(),
  /**
   * DPDP: raw IPs are never persisted. They are HMAC'd with this salt so the
   * same visitor is still detectable for abuse scoring. Rotating the salt
   * deliberately breaks that linkage.
   */
  LEAD_IP_HASH_SALT: z.string().min(16).default("dev-only-insecure-salt-change-me"),

  /* -- shared secrets guarding machine-to-machine routes ---------------- */
  CRON_SECRET: z.string().optional(),
  REVALIDATE_SECRET: z.string().optional(),

  /* -- behaviour switches ------------------------------------------------ */
  /** Set true to let the app boot with a stub DB — used by CI typechecks. */
  SKIP_ENV_VALIDATION: bool.default("false"),
});

export type ServerEnv = Readonly<z.infer<typeof serverSchema>>;

/* -------------------------------------------------------------------------
 * Lazy, memoised validation
 * ---------------------------------------------------------------------- */

export class EnvironmentError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(
      "Invalid environment configuration:\n" +
        issues.map((i) => `  • ${i}`).join("\n") +
        "\n\nCopy .env.example to .env and fill in the values.",
    );
    this.name = "EnvironmentError";
  }
}

let cached: ServerEnv | null = null;

/**
 * Treat an empty or whitespace-only variable as ABSENT.
 *
 * This matters more than it looks. `.env.example` lists every key with an
 * empty value, so a copied file hands zod `""` for each unset integration —
 * and `.optional()` / `.default()` only fire on `undefined`. Without this,
 * `R2_PUBLIC_BASE_URL=` fails as "invalid url" and an unconfigured optional
 * integration takes the whole app down, which is the exact opposite of the
 * degradation this design promises.
 *
 * Values are trimmed too: a trailing space on a pasted connection string is
 * a common copy-paste error and a pathological thing to have in a real
 * credential.
 */
function compact(raw: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim() !== "") {
      out[key] = value.trim();
    }
  }
  return out;
}

function parse(): ServerEnv {
  // The one sanctioned read of process.env in the codebase. Every other file
  // is blocked from it by `no-restricted-properties` in eslint.config.mjs,
  // which exempts only this module.
  const raw = compact(process.env);

  if (raw.SKIP_ENV_VALIDATION === "true" || raw.SKIP_ENV_VALIDATION === "1") {
    return serverSchema.parse({
      ...raw,
      DATABASE_URL: raw.DATABASE_URL ?? "postgres://stub:stub@localhost:5432/stub",
    });
  }

  const result = serverSchema.safeParse(raw);
  if (!result.success) {
    throw new EnvironmentError(
      result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    );
  }
  return Object.freeze(result.data);
}

/**
 * The validated environment. Reading any property validates once, then serves
 * from cache. Prefer the capability predicates below over poking at raw keys.
 */
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_t, prop: string) {
    cached ??= parse();
    return cached[prop as keyof ServerEnv];
  },
  has(_t, prop: string) {
    cached ??= parse();
    return prop in cached;
  },
});

/** Test seam: forget the memoised value so a new process env is re-read. */
export function resetEnvCache(): void {
  cached = null;
}

/* -------------------------------------------------------------------------
 * Capability predicates
 *
 * Call sites ask "is storage configured?" rather than "is R2_BUCKET set?".
 * That keeps the knowledge of WHICH vars a capability needs in this file, so
 * swapping R2 for S3 (seam 2) does not ripple outward.
 * ---------------------------------------------------------------------- */

export const capabilities = {
  get storage(): boolean {
    return Boolean(
      env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
    );
  },
  get queue(): boolean {
    return Boolean(env.QSTASH_TOKEN);
  },
  get queueSignature(): boolean {
    return Boolean(env.QSTASH_CURRENT_SIGNING_KEY && env.QSTASH_NEXT_SIGNING_KEY);
  },
  get redis(): boolean {
    return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
  },
  get mail(): boolean {
    return Boolean(env.RESEND_API_KEY);
  },
  get telegram(): boolean {
    return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  },
  get whatsapp(): boolean {
    return Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
  },
  get turnstile(): boolean {
    return Boolean(env.TURNSTILE_SECRET_KEY);
  },
  get isProduction(): boolean {
    return env.NODE_ENV === "production";
  },
} as const;
