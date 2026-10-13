/**
 * Four panels across, as on the reference board: links · actions · quote ·
 * signup. A server component — nothing here needs interactivity.
 *
 * Every link now resolves to a page. Every business fact comes from
 * src/content/site.ts, so the footer is correct the moment that file is.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { site, telLink, whatsappLink } from "@/content/site";

import { ArrowRight, BrandMark, Chat, Download, Phone, QuoteMark } from "./icons";
import { Tmpl } from "./page-shell";

const PRODUCT_LINKS = [
  { slug: "reach-in-refrigerator", label: "Reach-In" },
  { slug: "undercounter-refrigerator", label: "Undercounter" },
  { slug: "glass-door-refrigerator", label: "Glass Door" },
  { slug: "sushi-display-case", label: "Display Cases" },
  { slug: "deep-freezer", label: "Deep Freezers" },
] as const;

/**
 * A social icon is a LINK only once there is somewhere to go. While
 * `site.social.*` is still "#", it renders as a muted, non-interactive mark:
 * an anchor to "#" looks clickable, jumps the page to the top, and is read
 * out as a link by a screen reader.
 */
function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  if (!href || href === "#") {
    return (
      <span aria-hidden="true" title={`${label} — not set yet`} style={{ opacity: 0.45 }}>
        {children}
      </span>
    );
  }
  return (
    <a href={href} aria-label={label} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

const COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/about#certifications", label: "Certifications" },
  { href: "/industries", label: "Industries" },
  { href: "/support", label: "Service & AMC" },
  { href: "/downloads", label: "Downloads" },
  { href: "/compare", label: "Compare models" },
  { href: "/contact", label: "Contact" },
  { href: "/contact#dealership", label: "Become a dealer" },
] as const;

export function SiteFooter() {
  return (
    <footer className="section">
      <div className="container">
        <div className="foot-grid">
          <div className="panel foot-links">
            <div className="foot-col foot-brand">
              <Link className="brand" href="/" aria-label={`${site.brand.name} — home`}>
                <span style={{ color: "var(--ink)", display: "flex" }}><BrandMark /></span>
                <span className="brand__name">
                  {site.brand.short}<span className="brand__sub">{site.brand.sub}</span>
                </span>
              </Link>
              <p>{site.brand.blurb}</p>
              <p className="small">
                {site.legal.entity} <Tmpl />
                <br />
                GSTIN {site.legal.gstin}
              </p>
              <div className="social">
                <Social href={site.social.facebook} label="Facebook">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <path d="M8.9 12V7.6h1.5l.2-1.7H8.9V4.8c0-.5.1-.8.8-.8h.9V2.5a12 12 0 0 0-1.3-.1c-1.3 0-2.2.8-2.2 2.3v1.2H5.6v1.7h1.5V12h1.8Z" />
                  </svg>
                </Social>
                <Social href={site.social.instagram} label="Instagram">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="7" cy="7" r="2.3" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="10" cy="4" r=".8" fill="currentColor" />
                  </svg>
                </Social>
                <Social href={site.social.linkedin} label="LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <path d="M3 5h2v7H3V5Zm1-3a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 4 2Zm3 3h2v1a2.3 2.3 0 0 1 2-1c1.6 0 2 1 2 2.6V12H10V8.1c0-.9-.3-1.4-1-1.4s-1 .5-1 1.4V12H6V5h1Z" />
                  </svg>
                </Social>
                <Social href={site.social.youtube} label="YouTube">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <path d="M13 4.6a1.6 1.6 0 0 0-1.1-1.1C10.9 3.2 7 3.2 7 3.2s-3.9 0-4.9.3A1.6 1.6 0 0 0 1 4.6C.7 5.6.7 7 .7 7s0 1.4.3 2.4a1.6 1.6 0 0 0 1.1 1.1c1 .3 4.9.3 4.9.3s3.9 0 4.9-.3A1.6 1.6 0 0 0 13 9.4c.3-1 .3-2.4.3-2.4s0-1.4-.3-2.4ZM5.8 8.8V5.2L8.9 7 5.8 8.8Z" />
                  </svg>
                </Social>
              </div>
            </div>

            <div className="foot-col">
              <h4>Products</h4>
              {PRODUCT_LINKS.map((p) => (
                <Link key={p.slug} href={`/products/${p.slug}`}>{p.label}</Link>
              ))}
              <Link href="/products">All products</Link>
            </div>

            <div className="foot-col">
              <h4>Company</h4>
              {COMPANY_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
            </div>
          </div>

          <div className="panel foot-cta">
            <Link className="btn btn--primary btn--block" href="/contact#enquiry">
              Request a Quote
            </Link>
            <a className="btn btn--ghost btn--block" href={telLink(site.contact.salesPhone)}>
              <Phone size={14} /> {site.contact.salesPhone}
            </a>
            <a
              className="btn btn--ghost btn--block"
              href={whatsappLink("Enquiry from the website:")}
            >
              <Chat size={14} /> WhatsApp
            </a>
            <Link className="btn btn--ghost btn--block" href="/downloads">
              Downloads <Download />
            </Link>
            <p className="small">
              {site.contact.hours} · replies {site.contact.responseTime} <Tmpl />
            </p>
          </div>

          <div className="panel quote">
            <span className="quote__mark"><QuoteMark /></span>
            <p>
              Three summers in a Pune kitchen and it has not drifted once. The service
              response is the part that actually sold us.
            </p>
            <div className="quote__who">
              <span className="avatar" aria-hidden="true">RK</span>
              <span>
                <span className="quote__name">R. Kulkarni</span><br />
                <span className="quote__role">
                  Executive Chef <Tmpl label="real testimonial" />
                </span>
              </span>
            </div>
          </div>

          <div className="panel signup">
            <h4 style={{ fontSize: "var(--fs-body)" }}>Service &amp; support</h4>
            <p>
              Helpline, AMC plans, warranty terms and the {site.serviceCities.length}-city
              service list.
            </p>
            <Link className="btn btn--primary btn--block" href="/support">
              Get support <ArrowRight />
            </Link>
            <p className="small">
              Breakdown? Call{" "}
              <a href={telLink(site.contact.servicePhone)} style={{ color: "var(--ink)" }}>
                <strong>{site.contact.servicePhone}</strong>
              </a>
            </p>
          </div>
        </div>

        <div className="colophon">
          <p>
            © {new Date().getFullYear()} {site.legal.entity}.{" "}
            {site.isTemplate && "Demo build — company details are placeholders."}
          </p>
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/terms#ewaste">E-waste</Link>
            <Link href="/sitemap.xml">Sitemap</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
