/**
 * Cloudflare Turnstile — bot defence on the two public forms.
 *
 * Layer 2 of the lead path (HLD.md §6.1). Free and unlimited, and unlike a
 * CAPTCHA it is usually invisible, which matters on a form whose whole job is
 * to not lose enquiries.
 */
import { CaptchaError, UpstreamError } from "@/core";
import type { CaptchaVerifierPort } from "@/core";
import { capabilities, env } from "../env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

export class TurnstileVerifier implements CaptchaVerifierPort {
  async verify(token: string | null, remoteIp?: string): Promise<void> {
    if (!capabilities.turnstile) {
      // Fail closed in production — an unconfigured bot defence in prod is a
      // misconfiguration, not a reason to accept every submission.
      if (capabilities.isProduction) {
        throw new CaptchaError("Bot defence is not configured on this deployment");
      }
      return;
    }
    if (!token) throw new CaptchaError("Missing verification token");

    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY!,
      response: token,
    });
    if (remoteIp) body.set("remoteip", remoteIp);

    let payload: TurnstileResponse;
    try {
      const res = await fetch(VERIFY_URL, {
        method: "POST",
        body,
        // Never let a third party hold the user's request open.
        signal: AbortSignal.timeout(5_000),
      });
      payload = (await res.json()) as TurnstileResponse;
    } catch (cause) {
      throw new UpstreamError("turnstile", "verification request failed", cause);
    }

    if (!payload.success) {
      throw new CaptchaError();
    }
  }
}

/** Accepts everything. Development and automated tests only. */
export class AlwaysPassCaptcha implements CaptchaVerifierPort {
  async verify(): Promise<void> {
    /* no-op */
  }
}
