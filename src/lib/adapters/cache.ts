/**
 * Upstash Redis — cache, idempotency and rate limiting.  Seam 9.
 *
 * THE RULE (HLD-FREE-TIER.md §4.4): a page view never touches Redis and never
 * touches Postgres. Redis is for WRITES only — rate-limit buckets, idempotency
 * keys, the outbox work-pending flag and quota counters. That is what keeps
 * the projection at ~49k of 500k commands a month.
 *
 * Both adapters below degrade to a safe in-process fallback when Redis is
 * absent, so local development needs no cloud account.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { ConsoleLogger } from "@/core";
import type { CachePort, Logger, RateLimiterPort, RateLimitVerdict } from "@/core";
import { capabilities, env } from "../env";

let sharedRedis: Redis | null = null;

function redis(): Redis | null {
  if (!capabilities.redis) return null;
  sharedRedis ??= new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return sharedRedis;
}

/* -------------------------------------------------------------------------
 * Cache
 * ---------------------------------------------------------------------- */

export class RedisCacheAdapter implements CachePort {
  constructor(private readonly logger: Logger = new ConsoleLogger({ adapter: "redis" })) {}

  get available(): boolean {
    return capabilities.redis;
  }

  async get<T>(key: string): Promise<T | null> {
    const r = redis();
    if (!r) return null;
    try {
      return (await r.get<T>(key)) ?? null;
    } catch (cause) {
      // A cache miss is always survivable; a cache outage must not be.
      this.logger.log("warn", "cache get failed", { key, error: String(cause) });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const r = redis();
    if (!r) return;
    try {
      if (ttlSeconds) await r.set(key, value, { ex: ttlSeconds });
      else await r.set(key, value);
    } catch (cause) {
      this.logger.log("warn", "cache set failed", { key, error: String(cause) });
    }
  }

  async delete(key: string): Promise<void> {
    const r = redis();
    if (!r) return;
    try {
      await r.del(key);
    } catch (cause) {
      this.logger.log("warn", "cache delete failed", { key, error: String(cause) });
    }
  }

  /**
   * Atomic SET NX EX. This is what makes idempotency keys and the sweeper
   * gate correct under concurrency — a read-then-write would race.
   *
   * Returns true when the key was claimed by THIS caller.
   */
  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const r = redis();
    if (!r) return true; // no Redis: never block the caller
    try {
      const result = await r.set(key, value, { nx: true, ex: ttlSeconds });
      return result === "OK";
    } catch (cause) {
      this.logger.log("warn", "cache setIfAbsent failed; allowing", {
        key,
        error: String(cause),
      });
      return true;
    }
  }
}

/* -------------------------------------------------------------------------
 * Rate limiting
 * ---------------------------------------------------------------------- */

/**
 * Sliding window, keyed per identifier (hashed IP for the lead form).
 *
 * Fails OPEN: if Redis is unreachable we allow the request. A refused
 * enquiry costs a real sale; a few extra submissions during a Redis outage
 * cost nothing, and Turnstile is still in front.
 */
export class UpstashRateLimiter implements RateLimiterPort {
  private limiter: Ratelimit | null = null;

  constructor(
    private readonly tokens: number,
    private readonly window: `${number} s` | `${number} m` | `${number} h`,
    private readonly prefix: string,
    private readonly logger: Logger = new ConsoleLogger({ adapter: "ratelimit" }),
  ) {}

  async check(identifier: string): Promise<RateLimitVerdict> {
    const r = redis();
    if (!r) return { allowed: true, remaining: this.tokens, retryAfterSeconds: 0 };

    try {
      this.limiter ??= new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(this.tokens, this.window),
        prefix: this.prefix,
        analytics: false, // analytics would double the command count
      });

      const { success, remaining, reset } = await this.limiter.limit(identifier);
      return {
        allowed: success,
        remaining,
        retryAfterSeconds: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
      };
    } catch (cause) {
      this.logger.log("warn", "rate limit check failed; allowing", {
        error: String(cause),
      });
      return { allowed: true, remaining: this.tokens, retryAfterSeconds: 0 };
    }
  }
}
