/**
 * The chrome every page below the landing page shares.
 *
 * The home page puts the nav inside the same white panel as its hero and
 * separates them with a hairline; `PageHero` does exactly that for the inner
 * pages, so a visitor moving from `/` to `/support` sees the same card on the
 * same off-white ground rather than a second design.
 *
 * `PageSection` is the repeating unit below it: one panel, one optional
 * section head, one `id` so the sub-nav can anchor to it. Both are server
 * components — nothing here is interactive, so nothing here ships JavaScript.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { site } from "@/content/site";

import { SiteHeader } from "./site-header";

export interface Anchor {
  readonly href: string;
  readonly label: string;
}

interface HeroProps {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  /** In-page anchors, rendered as a scrollable pill row under the hero. */
  anchors?: readonly Anchor[];
  /** Anything that should sit inside the same panel, below the hero. */
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, lead, actions, anchors, children }: HeroProps) {
  return (
    <div className="section">
      <div className="container">
        <div className="panel">
          <SiteHeader />

          <section className="phero">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="h2">{title}</h1>
            {lead && <p className="measure">{lead}</p>}
            {actions && <div className="phero__actions">{actions}</div>}
          </section>

          {anchors && anchors.length > 0 && (
            <nav className="subnav" aria-label="On this page">
              {anchors.map((a) => (
                <Link key={a.href} href={a.href}>{a.label}</Link>
              ))}
            </nav>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lead?: ReactNode;
  /** Renders the section body without the surrounding panel padding. */
  bare?: boolean;
  children: ReactNode;
}

export function PageSection({ id, eyebrow, title, lead, bare, children }: SectionProps) {
  return (
    <section className="section" id={id}>
      <div className="container">
        <div className={bare ? "panel" : "panel blk"}>
          {(eyebrow || title || lead) && (
            <div className="band">
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2 className="h3">{title}</h2>}
              {lead && <p className="small">{lead}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Marks a value the business still has to supply. Renders nothing once
 * `site.isTemplate` is false, so the badges all leave together.
 */
export function Tmpl({ label = "template" }: { label?: string }) {
  if (!site.isTemplate) return null;
  return <span className="tmpl">{label}</span>;
}
