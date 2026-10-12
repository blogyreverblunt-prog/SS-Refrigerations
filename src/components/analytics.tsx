/**
 * Analytics — a seam, not a vendor.
 *
 * Renders one `defer`red script tag when `NEXT_PUBLIC_ANALYTICS_SRC` is set,
 * and nothing at all when it is not. Pointing the site at Plausible, Umami,
 * Fathom or Vercel Analytics is then two environment variables rather than a
 * code change, and the default state ships zero third-party JavaScript.
 *
 * The constraint that matters is COOKIELESS. A cookieless, non-fingerprinting
 * tag needs no consent banner under DPDP or GDPR, which is why this site has
 * none. Point this at Google Analytics and that stops being true: you then
 * owe visitors a banner, a rejection path that actually blocks the script,
 * and a longer privacy notice. Choose the tag accordingly.
 *
 * A server component, so the tag is in the HTML and costs no hydration.
 */
import { env } from "@/lib/env";

export function Analytics() {
  const src = env.NEXT_PUBLIC_ANALYTICS_SRC;
  if (!src) return null;

  const domain = env.NEXT_PUBLIC_ANALYTICS_DOMAIN;

  return (
    <script
      defer
      src={src}
      {...(domain ? { "data-domain": domain } : {})}
    />
  );
}
