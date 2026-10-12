/**
 * 404.
 *
 * Model codes churn — a page that existed when a spec sheet was emailed in
 * 2024 may not exist now, and the person who followed that link is exactly
 * the visitor worth recovering. So this offers the three things they were
 * probably looking for rather than an apology.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection } from "@/components/page-shell";
import { ArrowRight, Phone, Scale } from "@/components/icons";
import { site, telLink } from "@/content/site";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <>
      <PageHero
        eyebrow="404"
        title={<>That page has moved or never existed.</>}
        lead="If you followed a link to a model code, the range is still here — model codes get renamed more often than ranges do."
        actions={
          <>
            <Link className="btn btn--primary" href="/products">
              Browse the range <ArrowRight />
            </Link>
            <a className="btn btn--ghost" href={telLink(site.contact.salesPhone)}>
              <Phone size={14} /> {site.contact.salesPhone}
            </a>
          </>
        }
      />

      <PageSection eyebrow="Try these" title="Three places it is probably hiding.">
        <div className="cards">
          <Link className="card" href="/products">
            <h2 className="card__title">The product range</h2>
            <p>Six families, every live model code, with the specification table on each page.</p>
            <span className="link link--accent">Products <ArrowRight size={12} /></span>
          </Link>
          <Link className="card" href="/compare">
            <span className="card__icon"><Scale /></span>
            <h2 className="card__title">Compare models</h2>
            <p>If you were sent a comparison link, rebuild it here in two clicks.</p>
            <span className="link link--accent">Compare <ArrowRight size={12} /></span>
          </Link>
          <Link className="card" href="/downloads">
            <h2 className="card__title">Downloads</h2>
            <p>Spec sheets, manuals, brochures, certificates and CAD — nothing gated.</p>
            <span className="link link--accent">Downloads <ArrowRight size={12} /></span>
          </Link>
        </div>
      </PageSection>
    </>
  );
}
