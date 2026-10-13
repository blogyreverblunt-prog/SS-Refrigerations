"use client";

/**
 * The only client component in the chrome, and only because the mobile
 * drawer owns one boolean. Everything else on the page stays a server
 * component so the HTML a crawler sees is complete — HLD.md §5 Layer 3:
 * "Server-rendered HTML is non-negotiable."
 */
import Link from "next/link";

import { AccountLink } from "./account-link";
import { useEffect, useState } from "react";

import { site } from "@/content/site";

import { BrandMark, Menu } from "./icons";

/**
 * Five items, and every one of them a page.
 *
 * They used to be `/#anchors` into the landing page, two of which resolved
 * into the footer. Five primary items is also where the audited sites that
 * are easy to use sit; the ones at nine are harder to use, not richer
 * (SITE-SECTIONS-REPORT.md §7).
 */
const LINKS = [
  { href: "/products", label: "Products" },
  { href: "/industries", label: "Industries" },
  { href: "/support", label: "Service & Support" },
  { href: "/downloads", label: "Downloads" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // A resize past the breakpoint must not leave the drawer stranded open.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 761px)");
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header>
      <nav className="nav" aria-label="Primary">
        <Link className="brand" href="/" aria-label={`${site.brand.name} — home`}>
          <span style={{ color: "var(--ink)", display: "flex" }}>
            <BrandMark />
          </span>
          <span className="brand__name">
            {site.brand.short}
            <span className="brand__sub">{site.brand.sub}</span>
          </span>
        </Link>

        <ul className="nav__links">
          {LINKS.map((l) => (
            <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
          ))}
        </ul>

        <div className="nav__actions">
          <AccountLink className="nav__account" />
          <Link className="btn btn--primary" href="/contact#enquiry">Request a Quote</Link>
          <button
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-drawer"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span style={{ color: "var(--ink)", display: "flex" }}><Menu /></span>
          </button>
        </div>
      </nav>

      <div className={`nav__drawer${open ? " is-open" : ""}`} id="nav-drawer">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        <AccountLink className="nav__account" />
        <Link className="btn btn--primary btn--block" href="/contact#enquiry" onClick={() => setOpen(false)}>
          Request a Quote
        </Link>
      </div>
    </header>
  );
}
