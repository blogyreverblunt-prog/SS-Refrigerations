/**
 * About — one page, anchored.
 *
 * The five audited sites fragment this across up to six pages (history,
 * sustainability, R&D, manufacturing, governance, group companies) and none
 * of them is better for it. Nobody buys a cabinet with a ten-year service
 * life from a company they cannot verify, so this page exists to de-risk the
 * purchase: numbers, plant, certificates. A mission statement does not do
 * that; the certificate section does, and in an Indian tender it is
 * frequently the deciding document.
 *
 * Every fact on this page comes from src/content/site.ts.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { ArrowRight, Shield, Snowflake, Wrench } from "@/components/icons";
import { site } from "@/content/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "About us",
  description:
    "Who we are, what we manufacture, the certifications we hold and the service network behind every cabinet.",
};

const ANCHORS = [
  { href: "#overview", label: "Overview" },
  { href: "#numbers", label: "By the numbers" },
  { href: "#manufacturing", label: "Manufacturing" },
  { href: "#certifications", label: "Certifications" },
  { href: "#technology", label: "Engineering" },
  { href: "#sustainability", label: "Sustainability" },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={<>Cold equipment, built for Indian conditions.</>}
        lead={`${site.brand.name} designs, builds and services commercial refrigeration for professional kitchens, retail floors and cold stores — specified for 43 °C ambient and a 230 V supply that sags in summer.`}
        actions={
          <>
            <Link className="btn btn--primary" href="/contact#enquiry">
              Talk to us <ArrowRight />
            </Link>
            <Link className="btn btn--ghost" href="/downloads">
              Company profile &amp; catalogue
            </Link>
          </>
        }
        anchors={ANCHORS}
      >
        <div className="blk" style={{ paddingTop: 0 }}>
          <div className="proof">
            {site.proof.map((p) => (
              <span key={p}>
                {p} <Tmpl />
              </span>
            ))}
          </div>
        </div>
      </PageHero>

      {/* ------------------------------------------------------- overview */}
      <PageSection id="overview" eyebrow="Who we are" title="One category, done properly.">
        <div className="split">
          <div className="prose">
            <p>
              We make refrigeration and nothing else. Every cabinet we ship is a
              refrigerator, a freezer, a merchandiser, a display case or a cold
              room — which means the compressor selection, the insulation
              thickness and the airflow design are the whole of our engineering
              effort rather than one line in a catalogue of kitchen equipment.
            </p>
            <p>
              <Tmpl label="fill in" /> Trading since {site.legal.since}, operating as{" "}
              {site.legal.entity}, with design and assembly in-house and a
              service network that covers {site.serviceCities.length} cities.
            </p>
            <p>
              We quote per site. A cabinet that is wrong for the ambient, the
              door traffic or the supply voltage is a warranty claim waiting to
              happen, so every enquiry is specified before it is priced.
            </p>
          </div>

          <div className="aside">
            <div className="rows">
              <div className="rows__row">
                <span className="rows__k">Registered name</span>
                <span className="rows__v">
                  {site.legal.entity} <Tmpl />
                </span>
              </div>
              <div className="rows__row">
                <span className="rows__k">GSTIN</span>
                <span className="rows__v">
                  {site.legal.gstin} <Tmpl />
                </span>
              </div>
              <div className="rows__row">
                <span className="rows__k">CIN</span>
                <span className="rows__v">
                  {site.legal.cin} <Tmpl />
                </span>
              </div>
              <div className="rows__row">
                <span className="rows__k">Trading since</span>
                <span className="rows__v">
                  {site.legal.since} <Tmpl />
                </span>
              </div>
            </div>
            <Link className="link" href="/contact">
              Offices and contact details <ArrowRight />
            </Link>
          </div>
        </div>
      </PageSection>

      {/* -------------------------------------------------------- numbers */}
      <PageSection
        id="numbers"
        eyebrow="By the numbers"
        title="Five numbers, no adjectives."
        lead="Replace these with yours. A specific number is the cheapest credibility on the page; an adjective is the most expensive."
      >
        <div className="cards cards--5">
          {site.numbers.map((n) => (
            <div className="card" key={n.label}>
              <p className="stat__value">{n.value}</p>
              <p className="stat__label">{n.label}</p>
            </div>
          ))}
        </div>
        <p className="small">
          <Tmpl label="template values" /> Set these in{" "}
          <code>src/content/site.ts</code> → <code>numbers</code>.
        </p>
      </PageSection>

      {/* -------------------------------------------------- manufacturing */}
      <PageSection
        id="manufacturing"
        eyebrow="Manufacturing"
        title="Where the cabinets come from."
        lead="Plant photographs do more for a tender than any amount of copy. Swap these for your own floor, your own line and your own test bench."
      >
        <div className="cards cards--2">
          <article className="card" style={{ padding: 0, overflow: "clip" }}>
            <div className="ind__media" style={{ borderRadius: 0 }}>
              <Image
                src="/photos/condensing-technician-900.webp"
                alt="Assembly and test of a condensing unit"
                width={900}
                height={675}
                sizes="(max-width: 1024px) 90vw, 520px"
              />
            </div>
            <div style={{ padding: "var(--s-5)", display: "grid", gap: "var(--s-2)" }}>
              <h3 className="card__title">Assembly &amp; leak test</h3>
              <p>
                Every circuit is pressure-tested, evacuated and charged by weight,
                then run up to temperature before it is crated. <Tmpl />
              </p>
            </div>
          </article>

          <article className="card" style={{ padding: 0, overflow: "clip" }}>
            <div className="ind__media" style={{ borderRadius: 0 }}>
              <Image
                src="/photos/coldroom-warehouse-900.webp"
                alt="Panel and cold room fabrication"
                width={900}
                height={675}
                sizes="(max-width: 1024px) 90vw, 520px"
              />
            </div>
            <div style={{ padding: "var(--s-5)", display: "grid", gap: "var(--s-2)" }}>
              <h3 className="card__title">Panels &amp; cabinets</h3>
              <p>
                PUF-injected panels and SS 304 bodies, cut and formed in-house so a
                non-standard size is a drawing, not a new supplier. <Tmpl />
              </p>
            </div>
          </article>
        </div>
      </PageSection>

      {/* ------------------------------------------------- certifications */}
      <PageSection
        id="certifications"
        eyebrow="Quality and compliance"
        title="The documents a tender asks for."
        lead="Each of these should link to the certificate PDF on the downloads page. Until the files are uploaded the links point at the downloads index."
      >
        <div className="cards cards--5">
          {site.certifications.map((c) => (
            <article className="card" key={c.name}>
              <span className="card__icon"><Shield /></span>
              <h3 className="card__title">{c.name}</h3>
              <p>{c.note}</p>
              <Link className="link link--accent" href="/downloads?kind=certificate">
                Certificate <ArrowRight size={12} />
              </Link>
            </article>
          ))}
        </div>
        <p className="small">
          <Tmpl label="upload the PDFs" /> Drop the scans in and they appear on{" "}
          <Link className="link link--accent" href="/downloads">/downloads</Link> automatically.
        </p>
      </PageSection>

      {/* ----------------------------------------------------- engineering */}
      <PageSection
        id="technology"
        eyebrow="Engineering"
        title="What we actually build differently."
        lead="Only claim what you can measure. Three claims with numbers behind them beat ten adjectives, and a claim you cannot support is worse than no claim at all."
      >
        <div className="cards">
          <article className="card">
            <span className="card__icon"><Snowflake /></span>
            <h3 className="card__title">Stable to the shelf</h3>
            <p>
              Forced-air circulation holding every shelf inside ±0.5 °C, loaded or
              empty, measured top to bottom rather than at the sensor. <Tmpl label="verify" />
            </p>
          </article>
          <article className="card">
            <span className="card__icon"><Shield /></span>
            <h3 className="card__title">Rated for 43 °C ambient</h3>
            <p>
              Tested at the ambient an Indian kitchen actually runs at in May, not
              at the 32 °C a US spec sheet assumes.
            </p>
          </article>
          <article className="card">
            <span className="card__icon"><Wrench /></span>
            <h3 className="card__title">Serviceable in place</h3>
            <p>
              Front-breathing condensers and a removable deck, so a service visit
              does not start by pulling the cabinet out of the line.
            </p>
          </article>
        </div>
      </PageSection>

      {/* -------------------------------------------------- sustainability */}
      <PageSection
        id="sustainability"
        eyebrow="Sustainability"
        title="Natural refrigerants, and the paperwork for them."
      >
        <div className="split">
          <div className="prose">
            <p>
              R290 and R600a across the plug-in range: low GWP, and lower energy
              consumption than the R404A units they replace. Where a category still
              needs an HFC we say so on the product page rather than leaving it off
              the spec sheet.
            </p>
            <p>
              End-of-life matters as much as efficiency. We take back the cabinet we
              replace and route it through an authorised e-waste recycler —
              see the <Link className="link link--accent" href="/terms#ewaste">e-waste note</Link>.
            </p>
          </div>
          <div className="ind__media">
            <Image
              src="/photos/sustain-environment-1000.webp"
              alt=""
              width={1000}
              height={750}
              sizes="(max-width: 1024px) 90vw, 420px"
            />
          </div>
        </div>
      </PageSection>

      {/* ---------------------------------------------------------- out */}
      <PageSection
        eyebrow="Next"
        title="Two ways on from here."
        lead="Buyers want the range; everyone else wants a person. Both are one click away."
      >
        <div className="cards cards--2">
          <Link className="card" href="/products">
            <h3 className="card__title">Browse the range</h3>
            <p>Six families, every model code, capacities in litres and dimensions in millimetres.</p>
            <span className="link link--accent">Products <ArrowRight size={12} /></span>
          </Link>
          <Link className="card" href="/support">
            <h3 className="card__title">Service, AMC and spares</h3>
            <p>The helpline, what an AMC covers, warranty terms and the service city list.</p>
            <span className="link link--accent">Service &amp; support <ArrowRight size={12} /></span>
          </Link>
        </div>
      </PageSection>
    </>
  );
}
