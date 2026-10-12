import type { NextConfig } from "next";

/**
 * Host-agnostic on purpose (HLD-FREE-TIER.md §0.1): no Vercel-proprietary API
 * sits on a critical path, so moving to Cloudflare Workers stays a one-day
 * change rather than a rewrite.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Media is served from R2 behind a CDN, never optimised at runtime — that
  // is seam 3, and it is why there is no image optimiser bill.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
    unoptimized: true,
  },

  // Fail the build on a type or lint error. A green deploy should mean
  // something.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  /**
   * Security headers.
   *
   * HSTS is the half of "enforce HTTPS" that belongs to the application: it
   * tells the browser never to try this host over HTTP again. The other half
   * — redirecting an inbound http:// request — belongs to the host (Vercel
   * and Cloudflare both do it by default), because a Node process behind a
   * proxy cannot reliably tell what scheme the client used.
   *
   * `preload` is included but submission to the preload list is a deliberate,
   * hard-to-reverse act: do it at hstspreload.org only once the domain and
   * every subdomain are permanently on HTTPS.
   *
   * No Content-Security-Policy here yet. A real one needs per-request nonces
   * for Next's inline bootstrap script, which is a middleware change rather
   * than a header list, and a wrong CSP breaks the site silently for a
   * fraction of visitors. It is the next thing to add, not a line to guess.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Stops a browser second-guessing a declared Content-Type, which is
          // how an uploaded "image" becomes executable script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Full URL to ourselves, origin only to anyone else — so a quote
          // enquiry's query string never leaks to a third party.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Clickjacking: nothing here is meant to be framed.
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
