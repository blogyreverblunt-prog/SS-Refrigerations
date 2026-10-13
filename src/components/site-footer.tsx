/**
 * Four panels across, as on the reference board: links · actions · quote ·
 * signup. A server component — nothing here needs interactivity.
 *
 * Every link now resolves to a page. Every business fact comes from
 * src/content/site.ts, so the footer is correct the moment that file is.
 */
import Link from "next/link";

import { site, telLink, whatsappLink } from "@/content/site";

import { ArrowRight, BrandMark, Chat, Download, Phone, QuoteMark } from "./icons";
import { Tmpl } from "./page-shell";
import { SocialRow } from "./social";

const PRODUCT_LINKS = [
  { slug: "reach-in-refrigerator", label: "Reach-In" },
  { slug: "undercounter-refrigerator", label: "Undercounter" },
  { slug: "glass-door-refrigerator", label: "Glass Door" },
  { slug: "sushi-display-case", label: "Display Cases" },
  { slug: "deep-freezer", label: "Deep Freezers" },
] as const;

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
              <SocialRow />
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
          {/*
            Grievance officer is in this row rather than buried on /contact
            because the Consumer Protection (E-Commerce) Rules 2020 expect the
            contact to be findable, and the footer is where a complainant
            looks. E-waste earns its place for the same reason.
          */}
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/terms#ewaste">E-waste</Link>
            <Link href="/contact#grievance">Grievances</Link>
            <Link href="/sitemap.xml">Sitemap</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
