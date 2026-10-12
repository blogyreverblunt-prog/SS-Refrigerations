/**
 * Product detail — the most important page on the site.
 *
 * Organic search lands here, not on the home page, and three different
 * people use it: the chef checks capacity and layout, the kitchen consultant
 * needs the drawing and the CAD, the purchase manager needs warranty, power
 * rating and a spec sheet to put in a tender (docs/ia/SITE-SECTIONS-REPORT.md §4).
 *
 * The layout is the model picker — option C of the three sampled
 * (docs/ia/PURE-PLAY-BENCHMARK.md §4): the model list leads, and the
 * specification, the drawing, the spec sheet and the quote all follow the
 * selection. One family page, every model code on it, and the enquiry
 * carries the SKU the visitor actually chose.
 *
 * This file stays a SERVER component. It reads the catalogue, flattens the
 * variants into props, and hands the interactive shell to `ModelPicker`; the
 * sections below the picker — the full specification table, service, related
 * models — are passed as `children` and so are still server-rendered inside
 * it. A crawler gets the complete HTML either way.
 *
 * ISR with on-demand revalidation only. `generateStaticParams` pre-renders
 * every live product at build, so a visitor never waits on a database that
 * is cold-starting.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotFoundError } from "@/core";
import { container } from "@/lib/container";
import { PageSection, Tmpl } from "@/components/page-shell";
import { ModelPicker, type PickerModel } from "@/components/model-picker";
import { ArrowRight, Scale, Shield, Wrench } from "@/components/icons";
import { INDUSTRIES } from "@/content/industries";
import { site, telLink, whatsappLink } from "@/content/site";
import type { ProductDetail, VariantRow } from "@/modules/catalog";
import { env } from "@/lib/env";

export const revalidate = false;
export const dynamicParams = true;

const productImage = (slug: string) => `/products/${slug}.jpg`;

/** Pre-render every live product at build time. */
export async function generateStaticParams() {
  const rows = await container.catalogRepo().liveProductSlugs();
  return rows.map((r) => ({ slug: r.slug }));
}

async function load(slug: string): Promise<ProductDetail> {
  try {
    return await container.catalogRepo().findProductBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await container.catalogRepo().findProductBySlug(slug);
    return {
      title: p.name,
      description: p.summary?.slice(0, 160) ?? undefined,
      openGraph: { title: p.name, images: [productImage(p.slug)] },
    };
  } catch {
    return { title: "Product not found" };
  }
}

/* ---------------------------------------------------------------- helpers */

const num = (v: string | null) => (v === null ? null : Number(v));

function tempRange(v: VariantRow): string {
  const lo = num(v.tempMinC);
  const hi = num(v.tempMaxC);
  if (lo === null || hi === null) return "—";
  return `${lo} to ${hi} °C`;
}

function dims(v: VariantRow): string {
  const d = v.dimsMm as { w?: number; d?: number; h?: number } | null;
  if (!d?.w || !d.d || !d.h) return "—";
  return `${d.w} × ${d.d} × ${d.h}`;
}

/** Litres is primary for an Indian buyer; cu ft is the secondary unit. */
function capacity(v: VariantRow): string {
  const l = num(v.capacityL);
  if (l === null) return "—";
  return `${l} L  ·  ${(l * 0.0353147).toFixed(1)} cu ft`;
}

/* ------------------------------------------------------------------- page */

export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await load(slug);
  const specs = product.specs as { subTypes?: string[]; availableInIndia?: boolean } | null;
  const subTypes = specs?.subTypes ?? [];

  /*
    Flattened for the picker. The sub-type is matched positionally where the
    family declares as many sub-types as it has models — honest when it
    lines up, null when it does not, rather than guessing.
  */
  const aligned = subTypes.length === product.variants.length;
  const models: PickerModel[] = product.variants.map((v, i) => ({
    id: v.id,
    modelCode: v.modelCode,
    capacityL: num(v.capacityL),
    tempMinC: num(v.tempMinC),
    tempMaxC: num(v.tempMaxC),
    refrigerant: v.refrigerant,
    powerW: v.powerW,
    dims: (v.dimsMm as { w?: number; d?: number; h?: number } | null) ?? null,
    mrpInr: num(v.mrpInr),
    subType: aligned ? (subTypes[i] ?? null) : null,
  }));

  // Which industries recommend this family — the reverse of the mapping on
  // /industries, so the two pages can never disagree.
  const servesIndustries = INDUSTRIES.filter((i) =>
    i.products.some((p) => p.slug === product.slug),
  );

  // Everything else in the catalogue, for the related rail.
  const others = (await container.catalogRepo().listLive(24))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  const warranty = site.warranty[0] ?? { parts: "—", compressor: "—", labour: "—" };

  return (
    <>
      <ModelPicker
        turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          series: product.series,
          summary: product.summary,
        }}
        image={productImage(product.slug)}
        models={models}
        subTypes={subTypes}
        docs={product.documents.map((d) => ({
          id: d.id,
          kind: d.kind,
          title: d.title,
          storageKey: d.storageKey,
        }))}
        warranty={{
          parts: warranty.parts,
          compressor: warranty.compressor,
          labour: warranty.labour,
        }}
        salesPhone={site.contact.salesPhone}
        salesTel={telLink(site.contact.salesPhone)}
        whatsapp={whatsappLink(`Enquiry about ${product.name}:`)}
        serviceCities={site.serviceCities.length}
        unavailable={specs?.availableInIndia === false}
      >
        {/* ----------------------------------------- full specification table
            The picker shows one model; this shows all of them. It stays
            server-rendered because a tender team prints it and a crawler
            indexes every model code on it. */}
        <section className="section" id="specification">
          <div className="container">
            <div className="panel" style={{ padding: "var(--s-6)" }}>
              <div className="table-wrap">
                <table className="spec-table">
                  <caption>Every model in this family</caption>
                  <thead>
                    <tr>
                      <th scope="col">Model code</th>
                      <th scope="col">Capacity</th>
                      <th scope="col">Temperature</th>
                      <th scope="col">Refrigerant</th>
                      <th scope="col">Power</th>
                      <th scope="col">W × D × H (mm)</th>
                      <th scope="col">Price</th>
                      <th scope="col">Compare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id}>
                        <th scope="row">{v.modelCode}</th>
                        <td>{capacity(v)}</td>
                        <td>{tempRange(v)}</td>
                        <td>{v.refrigerant ?? "—"}</td>
                        <td>{v.powerW ? `${v.powerW} W` : "—"}</td>
                        <td>{dims(v)}</td>
                        <td>
                          {v.mrpInr
                            ? `₹${Number(v.mrpInr).toLocaleString("en-IN")}`
                            : "On request"}
                        </td>
                        <td>
                          <Link className="link link--accent" href={`/compare?m=${v.modelCode}`}>
                            Add <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {product.variants.length === 0 && (
                      <tr><td colSpan={8}>No model codes published for this family yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="small" style={{ marginTop: "var(--s-4)" }}>
                Dimensions are nominal and exclude handles and service clearances —
                see <Link className="link link--accent" href="/terms#specs">specification notice</Link>.
                Rated at 43 °C ambient, 230 V / 50 Hz single phase.{" "}
                <Tmpl label="confirm per model" />
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ service, warranty */}
        <PageSection
          id="warranty"
          eyebrow="Warranty and service"
          title="What happens after it is installed."
        >
          <div className="cards">
            <article className="card">
              <span className="card__icon"><Shield /></span>
              <h3 className="card__title">Warranty</h3>
              <p>
                {warranty.parts} parts, {warranty.compressor} on the compressor and{" "}
                {warranty.labour} labour on this range. <Tmpl label="confirm per range" />
              </p>
              <Link className="link link--accent" href="/support#warranty">
                Full terms <ArrowRight size={12} />
              </Link>
            </article>
            <article className="card">
              <span className="card__icon"><Wrench /></span>
              <h3 className="card__title">Service &amp; AMC</h3>
              <p>
                Engineers in {site.serviceCities.length} cities, genuine spares, and
                preventive visits before summer rather than during it.
              </p>
              <Link className="link link--accent" href="/support#amc">
                AMC plans <ArrowRight size={12} />
              </Link>
            </article>
            <article className="card">
              <span className="card__icon"><Scale /></span>
              <h3 className="card__title">Still deciding?</h3>
              <p>
                Put this family against another, side by side, and send the shortlist
                as one enquiry.
              </p>
              <Link className="link link--accent" href="/compare">
                Compare models <ArrowRight size={12} />
              </Link>
            </article>
          </div>
        </PageSection>

        {/* -------------------------------------------- suitable for / related */}
        {servesIndustries.length > 0 && (
          <PageSection
            eyebrow="Suitable for"
            title="Where this range earns its place."
            lead="Each link opens the section for that business, with the temperature band and the rest of the shortlist."
          >
            <div className="chips">
              {servesIndustries.map((i) => (
                <Link className="chip chip--accent" href={`/industries#${i.slug}`} key={i.slug}>
                  {i.name}
                </Link>
              ))}
            </div>
          </PageSection>
        )}

        {others.length > 0 && (
          <PageSection eyebrow="Related" title="Also worth looking at.">
            <div className="showcase">
              {others.map((p) => (
                <article className="panel show" key={p.id}>
                  <div className="show__body">
                    <h3 className="show__title">{p.name}</h3>
                    <p>{p.summary?.slice(0, 120)}…</p>
                    <Link className="link link--accent" href={`/products/${p.slug}`}>
                      Learn more <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="show__media">
                    <Image src={productImage(p.slug)} alt={p.name} fill
                           sizes="(max-width: 420px) 100vw, (max-width: 760px) 38vw, 170px" />
                  </div>
                </article>
              ))}
            </div>
          </PageSection>
        )}
      </ModelPicker>
    </>
  );
}
