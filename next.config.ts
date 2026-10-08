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
};

export default nextConfig;
