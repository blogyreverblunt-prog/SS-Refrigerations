"use client";

/**
 * The only client component in the chrome, and only because the mobile
 * drawer owns one boolean. Everything else on the page stays a server
 * component so the HTML a crawler sees is complete — HLD.md §5 Layer 3:
 * "Server-rendered HTML is non-negotiable."
 */
import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandMark, Menu } from "./icons";

const LINKS = [
  { href: "/products", label: "Products" },
  { href: "/#technology", label: "Technology" },
  { href: "/#industries", label: "Industries" },
  { href: "/#support", label: "Support" },
  { href: "/#company", label: "Company" },
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
        <Link className="brand" href="/" aria-label="KALT Refrigeration — home">
          <span style={{ color: "var(--ink)", display: "flex" }}>
            <BrandMark />
          </span>
          <span className="brand__name">
            KALT<span className="brand__sub">Refrigeration</span>
          </span>
        </Link>

        <ul className="nav__links">
          {LINKS.map((l) => (
            <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
          ))}
        </ul>

        <div className="nav__actions">
          <Link className="btn btn--primary" href="/#enquire">Request a Quote</Link>
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
        <Link className="btn btn--primary btn--block" href="/#enquire" onClick={() => setOpen(false)}>
          Request a Quote
        </Link>
      </div>
    </header>
  );
}
