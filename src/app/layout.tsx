import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
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
    default: "KALT Commercial Refrigeration — Reliable. Efficient. Precise.",
    template: "%s · KALT Refrigeration",
  },
  description:
    "Commercial refrigeration for professional kitchens — reach-in and undercounter cabinets, glass-door merchandisers, display cases and deep freezers.",
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
      </body>
    </html>
  );
}
