/**
 * The social preview card.
 *
 * Generated rather than drawn: a designer's PNG goes stale the day the
 * company name or the phone number changes, and this one is built from the
 * same `site` facts every page uses. Next renders it once at build and serves
 * a static PNG — there is no per-request cost.
 *
 * It is `opengraph-image`, so Next emits both `og:image` and
 * `twitter:image` from it; no separate Twitter card file is needed.
 *
 * Deliberately typographic. A product photograph would have to be cropped to
 * 1200×630 and every family has a different silhouette, so the one image that
 * works for every link is the name, the claim and the range.
 */
import { ImageResponse } from "next/og";

import { site } from "@/content/site";

export const alt = `${site.brand.name} — commercial refrigeration`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f9fb",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* The same snowflake as the favicon and the nav mark. */}
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 6.5v15M14 9.8 11.2 12M14 9.8l2.8 2.2M14 18.2l-2.8-2.2M14 18.2l2.8-2.2M7.5 10.25l13 7.5M7.5 17.75l13-7.5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#0f1115", letterSpacing: -0.5 }}>
              {site.brand.name}
            </div>
            <div style={{ fontSize: 16, color: "#676e7c", letterSpacing: 4, textTransform: "uppercase" }}>
              Commercial refrigeration
            </div>
          </div>
        </div>

        {/* claim */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              color: "#0f1115",
              letterSpacing: -2.5,
              lineHeight: 1.05,
            }}
          >
            {site.brand.tagline}
          </div>
          <div style={{ fontSize: 28, color: "#2a2d33", lineHeight: 1.4, maxWidth: 900 }}>
            Reach-in and undercounter cabinets, glass-door merchandisers, display
            cases, deep freezers and cold rooms — specified for 43 °C ambient.
          </div>
        </div>

        {/* proof strip */}
        <div style={{ display: "flex", gap: 14 }}>
          {["±0.5 °C stability", "Natural refrigerants", "Quoted per site", "Pan-India service"].map(
            (chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#2563eb",
                  background: "#eff4ff",
                  border: "1px solid #d6e4ff",
                  borderRadius: 999,
                  padding: "10px 22px",
                }}
              >
                {chip}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    size,
  );
}
