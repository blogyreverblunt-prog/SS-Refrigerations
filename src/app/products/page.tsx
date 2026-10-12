/**
 * Catalogue hub. Answers "do you even make the thing I need?" in one
 * screen — a six-card grid, because a flat list of model codes is unusable
 * (docs/ia/SITE-SECTIONS-REPORT.md §2).
 *
 * Three additions from the pure-play round (PURE-PLAY-BENCHMARK.md):
 *
 *  - a model COUNT on every card. Every site in the sample carries one, and
 *    it is the single most useful number on a category grid.
 *  - sub-type chips, so "do you do a glass-top freezer?" is answered here
 *    rather than one click deeper.
 *  - the two exits a specifier actually wants next: compare and downloads.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { container } from "@/lib/container";
import { PageHero, PageSection } from "@/components/page-shell";
import { ArrowRight, Download, Scale } from "@/components/icons";
import { INDUSTRIES } from "@/content/industries";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Reach-in and undercounter cabinets, glass-door merchandisers, display cases, deep freezers and walk-in cold rooms — capacities in litres, dimensions in millimetres.",
};

export default async function ProductsPage() {
  const repo = container.catalogRepo();
  const products = await repo.listLive(24);
  const details = await Promise.all(products.map((p) => repo.findProductBySlug(p.slug)));

  return (
    <>
      <PageHero
        eyebrow="The range"
        title={<>Commercial refrigeration,<br />six families.</>}
        lead="Every cabinet is specified for Indian ambient conditions and quoted per site. Capacities in litres, dimensions in millimetres, temperatures in °C."
        actions={
          <>
            <Link className="btn btn--primary" href="/contact#enquiry">
              Request a quote <ArrowRight />
            </Link>
            <Link className="btn btn--ghost" href="/compare">
              <Scale size={14} /> Compare models
            </Link>
            <Link className="btn btn--ghost" href="/downloads">
              Catalogue &amp; spec sheets <Download />
            </Link>
          </>
        }
      />

      <PageSection bare>
        <div className="blk">
          <div className="showcase">
            {details.map((p) => {
              const lead = p.variants[0];
              return (
                <article className="panel show" key={p.id}>
                  <div className="show__body">
                    <h2 className="show__title">{p.name}</h2>
                    <p>{p.summary ?? ""}</p>
                    <div className="chips" style={{ marginBottom: "var(--s-2)" }}>
                      <span className="chip chip--accent">
                        {p.variants.length} model{p.variants.length === 1 ? "" : "s"}
                      </span>
                      {lead?.tempMinC && lead.tempMaxC && (
                        <span className="chip">
                          {Number(lead.tempMinC)} to {Number(lead.tempMaxC)} °C
                        </span>
                      )}
                    </div>
                    <Link className="link link--accent" href={`/products/${p.slug}`}>
                      View models <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="show__media">
                    <Image src={`/products/${p.slug}.jpg`} alt={p.name} fill
                           sizes="(max-width: 420px) 100vw, (max-width: 760px) 38vw, 170px" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Sub-types, so the long-tail question is answered on the hub. */}
        <div className="blk">
          <div className="band">
            <p className="eyebrow">Looking for something specific?</p>
            <h2 className="h3">Every configuration we build.</h2>
            <p className="small">
              Sub-types within each family. Not sure which applies to your kitchen?
              Describe the job and we will shortlist two.
            </p>
          </div>
          <div className="cards cards--2">
            {details.map((p) => {
              const specs = p.specs as { subTypes?: string[] } | null;
              return (
                <article className="card" key={p.id}>
                  <h3 className="card__title">{p.name}</h3>
                  <div className="chips">
                    {(specs?.subTypes ?? ["Specification on request"]).map((t) => (
                      <span className="chip" key={t}>{t}</span>
                    ))}
                  </div>
                  <Link className="link link--accent" href={`/products/${p.slug}`}>
                    Open the range <ArrowRight size={12} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </PageSection>

      {/* -------------------------------------------------- by industry */}
      <PageSection
        eyebrow="Or start from your business"
        title="Six industries, three recommendations each."
        lead="A bakery owner does not search for an undercounter refrigerator; they search for a bakery display cabinet. This is the other way in."
      >
        <div className="cards">
          {INDUSTRIES.map((i) => (
            <Link className="card" href={`/industries#${i.slug}`} key={i.slug}>
              <h3 className="card__title">{i.name}</h3>
              <p>{i.band}</p>
              <span className="link link--accent">
                What we recommend <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </PageSection>
    </>
  );
}
