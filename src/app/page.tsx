/**
 * Home.
 *
 * A SERVER component: the category grid, the showcase and the industry rail
 * are all rendered from the database on the server, so a crawler sees the
 * full catalogue in the HTML without executing anything (HLD.md §5 Layer 3).
 *
 * `revalidate = false` with on-demand revalidation only — time-based ISR is
 * a hidden database poll, and on Neon Free that alone would eat the 100
 * CU-hour budget (HLD-FREE-TIER.md §4.1). Freshness comes from
 * POST /api/revalidate firing on publish.
 */
import Image from "next/image";
import Link from "next/link";

import { container } from "@/lib/container";
import { site, telLink, whatsappLink } from "@/content/site";
import { SiteHeader } from "@/components/site-header";
import { EnquiryForm } from "@/components/enquiry-form";
import { ProductViewer } from "@/components/product-viewer";
import { cabinetFromVariant } from "@/components/product-viewer/types";
import { env } from "@/lib/env";
import {
  ArrowRight,
  Cabinet,

  Shield,
  Snowflake,
} from "@/components/icons";

export const revalidate = false;

/** Product renders live in public/products, keyed by slug. */
const productImage = (slug: string) => `/products/${slug}.jpg`;

/** First sentence of a summary, for places that need a line not a paragraph. */
function firstSentence(text: string | null | undefined): string | null {
  if (!text) return null;
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
}

/**
 * Four of the six industries, each linking into its own anchored section on
 * /industries. The landing page's job is to route in one click, not to hold
 * the content itself.
 */
/*
  The 400px variants where they exist: these render in a ~260px cell, and
  `images.unoptimized` is on (media is served from R2 behind a CDN, seam 3),
  so whatever file is named here is the file the visitor downloads. Serving
  the 900px coldroom here cost 320 KB for a thumbnail.
*/
const INDUSTRIES = [
  { title: "Restaurants & QSR", img: "/photos/industry-qsr-800.webp", href: "/industries#restaurants-qsr" },
  { title: "Bakery & Patisserie", img: "/photos/industry-bakery-800.webp", href: "/industries#bakery-patisserie" },
  { title: "Supermarket & Retail", img: "/photos/retail-merchandiser-400.webp", href: "/industries#supermarket-retail" },
  { title: "Hotels & Institutional", img: "/photos/coldroom-warehouse-400.webp", href: "/industries#hotels-institutional" },
] as const;

const STATS = [
  { value: "±0.5 °C", label: "Temperature stability" },
  { value: "1300 L", label: "Gross capacity" },
  { value: "R290", label: "Natural refrigerant" },
  { value: "5 yr", label: "Compressor warranty" },
] as const;

export default async function HomePage() {
  const repo = container.catalogRepo();
  const products = await repo.listLive(6);

  // The hero leads on the reach-in; fall back to whatever is live first so
  // the page never depends on one specific row existing.
  const hero = products.find((p) => p.slug === "reach-in-refrigerator") ?? products[0];
  const showcase = products.filter((p) => p.slug !== hero?.slug).slice(0, 3);

  const heroSlug = hero?.slug ?? "reach-in-refrigerator";

  /*
    No 3D asset exists for these units, but the catalogue already stores
    every cabinet's dimensions. The hero model is generated from the lead
    variant's dims_mm, so it is correct for whatever product is live rather
    than hard-coded to one. When a real glTF arrives this becomes
    `{ kind: "model", url }` and nothing else changes.
  */
  const heroVariant = hero
    ? (await repo.findProductBySlug(hero.slug)).variants[0]
    : undefined;
  const heroCabinet = heroVariant
    ? cabinetFromVariant(heroSlug, heroVariant.dimsMm)
    : null;

  return (
    <>
      {/* ---------------------------------------- panel 1: nav + hero + stats */}
      <div className="section">
        <div className="container">
          <div className="panel">
            <SiteHeader />

            <section className="hero" aria-labelledby="hero-title">
              <div className="hero__copy">
                <p className="eyebrow">Introducing</p>
                <div className="hero__title">
                  <h1 className="display" id="hero-title">HR&#8209;78</h1>
                  <p className="hero__sub">Reliable. Efficient. Precise.</p>
                </div>
                {/*
                  The stored summary is a full catalogue paragraph. The hero
                  wants two lines, so it is clipped at the first sentence —
                  the detail page shows it in full.
                */}
                <p className="measure">
                  {firstSentence(hero?.summary) ??
                    "A two-section reach-in refrigerator built for the pace of a professional kitchen — and for an Indian summer."}
                </p>
                <div className="hero__actions">
                  <Link className="btn btn--primary" href="/products">
                    Explore the range <ArrowRight />
                  </Link>
                  {hero && (
                    <Link className="btn btn--ghost" href={`/products/${hero.slug}`}>
                      This model
                    </Link>
                  )}
                  {/*
                    "Play Overview" lived here as a <span> with no handler —
                    a control that looked clickable and did nothing, on the
                    most-seen screen on the site. It comes back as a link the
                    day there is a video to point it at.
                  */}
                </div>
              </div>

              <div className="hero__media">
                {/*
                  The poster is the LCP element and renders immediately; the
                  3D cabinet is generated from the variant's own dims_mm and
                  loaded only when the visitor asks for it.
                */}
                <ProductViewer
                  poster={productImage(heroSlug)}
                  alt={hero?.name ?? "Reach-in refrigerator"}
                  source={
                    heroCabinet
                      ? { kind: "procedural", spec: heroCabinet }
                      : { kind: "static" }
                  }
                />
              </div>
            </section>

            <section className="stats" aria-label="Key specifications">
              {STATS.map((s) => (
                <div className="stat" key={s.label}>
                  <p className="stat__value">{s.value}</p>
                  <p className="stat__label">{s.label}</p>
                </div>
              ))}
            </section>

            <section className="features" id="technology" aria-labelledby="tech-title">
              <div className="features__intro">
                <h2 className="h3" id="tech-title">Engineered for the<br />working kitchen</h2>
                <p className="small">
                  Forced-air circulation, a natural refrigerant and 304 stainless
                  throughout — specified for service life, not for a showroom.
                </p>
                <Link className="link" href="/about#technology">
                  Explore Technology <ArrowRight />
                </Link>
              </div>

              <div className="features__grid">
                <article className="feature">
                  <span className="feature__icon"><Snowflake /></span>
                  <h3 className="feature__title">Stable to the shelf</h3>
                  <p>Forced-air circulation holds every shelf inside ±0.5&nbsp;°C, top to bottom, loaded or empty.</p>
                </article>
                <article className="feature">
                  <span className="feature__icon"><Cabinet /></span>
                  <h3 className="feature__title">Fits the line you have</h3>
                  <p>700&nbsp;mm depth and field-reversible doors, so it drops into an existing run without rework.</p>
                </article>
                <article className="feature">
                  <span className="feature__icon"><Shield /></span>
                  <h3 className="feature__title">Built to endure</h3>
                  <p>SS&nbsp;304 inside and out, tested at 43&nbsp;°C ambient and rated for the grid you actually have.</p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ------------------------------------------- showcase, from the DB */}
      <section className="section" id="products" aria-labelledby="products-title">
        <div className="container">
          <h2 className="visually-hidden" id="products-title">Product range</h2>
          <div
            className="cmp-bar"
            style={{ marginBottom: "var(--s-5)", alignItems: "center" }}
          >
            <p className="eyebrow">Three of six families</p>
            <div className="phero__actions">
              <Link className="link" href="/products">
                All products <ArrowRight />
              </Link>
              <Link className="link" href="/compare">
                Compare models <ArrowRight />
              </Link>
            </div>
          </div>
          <div className="showcase">
            {showcase.map((p) => (
              <article className="panel show" key={p.id}>
                <div className="show__body">
                  <h3 className="show__title">{p.name}</h3>
                  <p>{p.summary?.slice(0, 120)}…</p>
                  <Link className="link link--accent" href={`/products/${p.slug}`}>
                    Learn more <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="show__media">
                  {/* `fill` + a relative parent: the media box is sized by the
                      card, not by the file, so the image must follow it. */}
                  <Image src={productImage(p.slug)} alt={p.name} fill
                         sizes="(max-width: 420px) 100vw, (max-width: 760px) 38vw, 170px" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- industries */}
      <section className="section" id="industries" aria-labelledby="ind-title">
        <div className="container">
          <div className="panel apps">
            <div className="apps__intro">
              <h2 className="h3" id="ind-title">One range.<br />Every kitchen.</h2>
              <p className="small">
                From a single counter to a cold room, the same cabinets serve
                restaurants, bakeries, retail floors and bulk storage.
              </p>
              <Link className="link" href="/industries">
                Explore Industries <ArrowRight />
              </Link>
            </div>
            <div className="apps__grid">
              {INDUSTRIES.map((ind) => (
                <Link className="app" href={ind.href} key={ind.title}>
                  <h3 className="app__title">{ind.title}</h3>
                  <span className="app__img">
                    <Image src={ind.img} alt="" width={800} height={600}
                           sizes="(max-width: 760px) 90vw, 260px" />
                  </span>
                  <span className="app__go" aria-hidden="true"><ArrowRight /></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- the enquiry */}
      <section className="section" id="enquire" aria-labelledby="enq-title">
        <div className="container">
          <div className="panel" style={{ padding: "var(--s-8) var(--s-6)" }}>
            {/* Two columns: the form, and the reasons to use the phone instead.
                A 640px form in a 1200px panel leaves half the band empty. */}
            <div className="split">
            <div style={{ display: "grid", gap: "var(--s-6)" }}>
              <div>
                <p className="eyebrow">Get in touch</p>
                <h2 className="h3" id="enq-title" style={{ marginTop: "var(--s-2)" }}>
                  Tell us what the kitchen needs.
                </h2>
                <p className="small" style={{ marginTop: "var(--s-2)" }}>
                  We quote per site. Send the model and quantity if you have them,
                  or just describe the job. Prefer to call, or need the service
                  desk instead?{" "}
                  <Link className="link link--accent" href="/contact">
                    Contact page <ArrowRight size={12} />
                  </Link>
                </p>
              </div>
              <EnquiryForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
            </div>

            <div className="aside">
              <div className="callout">
                <div>
                  <p className="callout__k">Sales</p>
                  <p className="callout__v">
                    <a href={telLink(site.contact.salesPhone)}>{site.contact.salesPhone}</a>
                  </p>
                  <p className="small">{site.contact.hours}</p>
                </div>
                <div>
                  <p className="callout__k">WhatsApp</p>
                  <p className="callout__v">
                    <a href={whatsappLink("Enquiry from the website:")}>Start a chat</a>
                  </p>
                  <p className="small">Send a photo of the site or the rating plate</p>
                </div>
              </div>

              <div className="cards cards--2">
                <Link className="card" href="/support">
                  <h3 className="card__title">A cabinet has stopped cooling</h3>
                  <p>Service desk, helpline and AMC — not this form.</p>
                  <span className="link link--accent">
                    Service &amp; support <ArrowRight size={12} />
                  </span>
                </Link>
                <Link className="card" href="/downloads">
                  <h3 className="card__title">You need a spec sheet</h3>
                  <p>Spec sheets, manuals and drawings. Nothing gated.</p>
                  <span className="link link--accent">
                    Downloads <ArrowRight size={12} />
                  </span>
                </Link>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
