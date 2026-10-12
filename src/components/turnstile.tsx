/**
 * Cloudflare Turnstile — the browser half of the bot defence.
 *
 * This file exists because its absence took the lead form down. The server
 * verifier in `lib/adapters/captcha.ts` fails closed in production, which is
 * correct, but nothing in the app had ever been told to produce a token. Every
 * enquiry was rejected with `captcha_failed` while the build stayed green.
 *
 * It uses Turnstile's IMPLICIT rendering mode, which is the reason this is 30
 * lines and not 200: the script scans for `.cf-turnstile` elements and injects
 * a hidden `<input name="cf-turnstile-response">` into the ENCLOSING FORM. The
 * form then reads it straight out of `FormData` with no state, no ref and no
 * callback plumbing. Drop the widget inside a `<form>` and it works.
 *
 * Two consequences worth knowing:
 *
 *  1. A token is SINGLE USE. After a successful submit the widget must be
 *     reset or the next submit replays a spent token and fails verification.
 *     `resetTurnstile()` below does that; the forms call it after success.
 *  2. With no site key this renders NOTHING. That is deliberate — it keeps
 *     `next dev` working with no Cloudflare account. The matching server-side
 *     behaviour is in `captcha.ts`, which only enforces when both halves of
 *     the pair are configured.
 */
"use client";

/** The name Turnstile gives the hidden input it injects into the form. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

interface TurnstileApi {
  reset: (container?: string | HTMLElement) => void;
}

/**
 * Clear a spent token so the same form can be submitted again.
 *
 * Tolerates the script being absent, blocked by an extension, or not yet
 * loaded. A failure here must never break the success path the visitor has
 * already completed.
 */
export function resetTurnstile(container?: HTMLElement | null): void {
  const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
  if (!api) return;
  try {
    api.reset(container ?? undefined);
  } catch {
    /* a reset failure is not worth surfacing to the visitor */
  }
}

/**
 * The script tag. Rendered once per page from the root layout rather than per
 * form, because a page can hold several forms and the API is a singleton.
 */
export function TurnstileScript({ siteKey }: { siteKey?: string | undefined }) {
  if (!siteKey) return null;
  return <script src={SCRIPT_SRC} async defer />;
}

/**
 * The widget itself. Place it INSIDE the `<form>` whose submission it guards.
 */
export function TurnstileWidget({
  siteKey,
  className,
}: {
  siteKey?: string | undefined;
  className?: string | undefined;
}) {
  if (!siteKey) return null;
  return (
    <div
      className={["cf-turnstile", className].filter(Boolean).join(" ")}
      data-sitekey={siteKey}
      data-appearance="interaction-only"
      data-size="flexible"
    />
  );
}
