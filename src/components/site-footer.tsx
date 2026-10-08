/**
 * Four panels across, as on the reference board: links · actions · quote ·
 * signup. A server component — nothing here needs interactivity.
 */
import Link from "next/link";

import { ArrowRight, BrandMark, Download, PlayCircle, QuoteMark } from "./icons";

const PRODUCT_LINKS = [
  { slug: "reach-in-refrigerator", label: "Reach-In" },
  { slug: "undercounter-refrigerator", label: "Undercounter" },
  { slug: "glass-door-refrigerator", label: "Glass Door" },
  { slug: "sushi-display-case", label: "Display Cases" },
  { slug: "deep-freezer", label: "Deep Freezers" },
] as const;

export function SiteFooter() {
  return (
    <footer className="section" id="support">
      <div className="container">
        <div className="foot-grid">
          <div className="panel foot-links">
            <div className="foot-col foot-brand">
              <Link className="brand" href="/" aria-label="KALT Refrigeration — home">
                <span style={{ color: "var(--ink)", display: "flex" }}><BrandMark /></span>
                <span className="brand__name">
                  KALT<span className="brand__sub">Refrigeration</span>
                </span>
              </Link>
              <p>Commercial refrigeration for professional kitchens across India.</p>
              <div className="social">
                <a href="#" aria-label="LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <path d="M3 5h2v7H3V5Zm1-3a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 4 2Zm3 3h2v1a2.3 2.3 0 0 1 2-1c1.6 0 2 1 2 2.6V12H10V8.1c0-.9-.3-1.4-1-1.4s-1 .5-1 1.4V12H6V5h1Z" />
                  </svg>
                </a>
                <a href="#" aria-label="YouTube">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <path d="M13 4.6a1.6 1.6 0 0 0-1.1-1.1C10.9 3.2 7 3.2 7 3.2s-3.9 0-4.9.3A1.6 1.6 0 0 0 1 4.6C.7 5.6.7 7 .7 7s0 1.4.3 2.4a1.6 1.6 0 0 0 1.1 1.1c1 .3 4.9.3 4.9.3s3.9 0 4.9-.3A1.6 1.6 0 0 0 13 9.4c.3-1 .3-2.4.3-2.4s0-1.4-.3-2.4ZM5.8 8.8V5.2L8.9 7 5.8 8.8Z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="7" cy="7" r="2.3" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="10" cy="4" r=".8" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="foot-col">
              <h4>Products</h4>
              {PRODUCT_LINKS.map((p) => (
                <Link key={p.slug} href={`/products/${p.slug}`}>{p.label}</Link>
              ))}
            </div>

            <div className="foot-col">
              <h4>Company</h4>
              <Link href="/#company">About Us</Link>
              <Link href="/#company">Certifications</Link>
              <Link href="/#support">Service &amp; AMC</Link>
              <Link href="/products">Downloads</Link>
              <Link href="/#enquire">Contact</Link>
            </div>
          </div>

          <div className="panel foot-cta" id="company">
            <Link className="btn btn--primary btn--block" href="/#enquire">Request a Quote</Link>
            <button className="btn btn--ghost btn--block" type="button" disabled>
              Download Spec Sheet <Download />
            </button>
            <button className="btn btn--ghost btn--block" type="button" disabled>
              Play Overview <PlayCircle />
            </button>
            <p className="small">
              Or call <strong style={{ color: "var(--ink)" }}>+91 00000 00000</strong> — Mon–Sat, 9am–7pm.
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
                <span className="quote__role">Executive Chef, placeholder client</span>
              </span>
            </div>
          </div>

          <div className="panel signup">
            <h4 style={{ fontSize: "var(--fs-body)" }}>Explore the range</h4>
            <p>Six families, every model, spec sheets and downloads in one place.</p>
            <Link className="btn btn--primary btn--block" href="/products">
              Browse Products <ArrowRight />
            </Link>
          </div>
        </div>

        <div className="colophon">
          <p>
            © {new Date().getFullYear()} KALT Refrigeration. Demo build — copy, model
            codes and contact details are placeholders.
          </p>
          <nav aria-label="Legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Sitemap</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
