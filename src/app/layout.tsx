import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { Analytics } from "@/components/analytics";
import { TurnstileScript } from "@/components/turnstile";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";
import { env } from "@/lib/env";
import "./globals.css";

/**
 * next/font self-hosts Inter and inlines the @font-face, so there is no
 * render-blocking request to Google and no layout shift on first paint.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  /**
   * Required for Open Graph and Twitter image URLs to resolve to absolute
   * links. Without it Next falls back to localhost, so every social preview
   * in production would point at a machine nobody can reach.
   */
  metadataBase: new URL(env.APP_URL),
  title: {
    default: `${site.brand.name} — Commercial Refrigeration · ${site.brand.tagline}`,
    template: `%s · ${site.brand.name}`,
  },
  description:
    "Commercial refrigeration for professional kitchens — reach-in and undercounter cabinets, glass-door merchandisers, display cases, deep freezers and walk-in cold rooms, specified for Indian conditions.",

  /**
   * Inherited by every page, so a link to any route previews correctly. The
   * image comes from `opengraph-image.tsx` automatically — naming it here
   * would override the generated one.
   */
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.brand.name,
    locale: "en_IN",
    url: "/",
    title: `${site.brand.name} — Commercial Refrigeration`,
    description:
      "Cabinets, merchandisers, display cases, deep freezers and cold rooms for professional kitchens, retail floors and cold stores across India.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f9fb",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {/*
          The header is NOT wrapped in a panel here. In this design the nav
          lives inside the same white card as the hero, separated only by a
          hairline — so the page owns that panel and renders SiteHeader as
          its first child. The layout contributes only the chrome that is
          genuinely shared.
        */}
        <main id="main">{children}</main>
        <SiteFooter />
        {/* Renders nothing unless NEXT_PUBLIC_ANALYTICS_SRC is configured. */}
        <Analytics />
        {/* One script per page, not per form — the Turnstile API is a
            singleton and a page can carry more than one enquiry form. */}
        <TurnstileScript siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      </body>
    </html>
  );
}
