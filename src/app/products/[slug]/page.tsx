/**
 * Product detail — the most important page on the site.
 *
 * Organic search lands here, not on the home page, and three different
 * people use it: the chef checks capacity and layout, the kitchen consultant
 * needs the drawing and the CAD, the purchase manager needs warranty, power
 * rating and a spec sheet to put in a tender (docs/ia/SITE-SECTIONS-REPORT.md §4).
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
import { SiteHeader } from "@/components/site-header";
import { EnquiryForm } from "@/components/enquiry-form";
import { ArrowRight, Download } from "@/components/icons";
import type { ProductDetail, VariantRow } from "@/modules/catalog";

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
  const lead = product.variants[0];
  const specs = product.specs as { subTypes?: string[]; availableInIndia?: boolean } | null;

  return (
    <>
      <div className="section">
        <div className="container">
          <div className="panel">
            <SiteHeader />

            <section className="pdp">
              <div className="pdp__media">
                <Image
                  src={productImage(product.slug)}
                  alt={product.name}
                  width={1295}
                  height={1020}
                  priority
                  sizes="(max-width: 1024px) 90vw, 560px"
                />
              </div>

              <div className="pdp__copy">
                <nav className="crumb" aria-label="Breadcrumb">
                  <Link href="/">Home</Link><span>/</span>
                  <Link href="/products">Products</Link><span>/</span>
                  <span style={{ color: "var(--ink)" }}>{product.name}</span>
                </nav>

                <h1 className="pdp__title">{product.name}</h1>
                {product.series && <p className="eyebrow">{product.series}</p>}
                <p>{product.summary}</p>

                {/* At-a-glance, metric first. */}
                {lead && (
                  <dl className="glance">
                    <div><dt>Capacity</dt><dd>{capacity(lead)}</dd></div>
                    <div><dt>Temperature</dt><dd>{tempRange(lead)}</dd></div>
                    <div><dt>Refrigerant</dt><dd>{lead.refrigerant ?? "—"}</dd></div>
                    <div><dt>W × D × H</dt><dd>{dims(lead)} mm</dd></div>
                    <div><dt>Power</dt><dd>{lead.powerW ? `${lead.powerW} W` : "—"}</dd></div>
                    <div><dt>Models</dt><dd>{product.variants.length}</dd></div>
                  </dl>
                )}

                {/*
                  The pricing seam, rendered. Every variant's mrp_inr is NULL
                  today, so this shows the quote path instead of a number.
                  Switching pricing on is a template change here, not a
                  migration — see SITE-SECTIONS-REPORT.md §4.
                */}
                <p className="price-slot">
                  {lead?.mrpInr
                    ? <><strong>₹{Number(lead.mrpInr).toLocaleString("en-IN")}</strong> + GST</>
                    : <>Priced per site. <strong>Request a quote</strong> for current pricing, freight and installation.</>}
                </p>

                <div className="hero__actions">
                  <Link className="btn btn--primary" href="#enquire">
                    Request a Quote <ArrowRight />
                  </Link>
                  <button className="btn btn--ghost" type="button" disabled>
                    Download Spec Sheet <Download />
                  </button>
                </div>

                {specs?.subTypes && specs.subTypes.length > 0 && (
                  <div className="chips">
                    {specs.subTypes.map((t) => <span className="chip" key={t}>{t}</span>)}
                  </div>
                )}

                {specs?.availableInIndia === false && (
                  <p className="notice notice--err" role="note">
                    <strong>Regional availability</strong>
                    This family is not currently supplied in this market. Contact us
                    to discuss alternatives.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- spec table */}
      <section className="section">
        <div className="container">
          <div className="panel" style={{ padding: "var(--s-6)" }}>
            <div className="table-wrap">
              <table className="spec-table">
                <caption>Specifications by model</caption>
                <thead>
                  <tr>
                    <th scope="col">Model code</th>
                    <th scope="col">Capacity</th>
                    <th scope="col">Temperature</th>
                    <th scope="col">Refrigerant</th>
                    <th scope="col">Power</th>
                    <th scope="col">W × D × H (mm)</th>
                    <th scope="col">Price</th>
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
                      <td>{v.mrpInr ? `₹${Number(v.mrpInr).toLocaleString("en-IN")}` : "On request"}</td>
                    </tr>
                  ))}
                  {product.variants.length === 0 && (
                    <tr><td colSpan={7}>No model codes published for this family yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ inline enquiry */}
      <section className="section" id="enquire">
        <div className="container">
          <div className="panel" style={{ padding: "var(--s-8) var(--s-6)" }}>
            <div style={{ display: "grid", gap: "var(--s-6)", maxWidth: "640px" }}>
              <div>
                <p className="eyebrow">Request a quote</p>
                <h2 className="h3" style={{ marginTop: "var(--s-2)" }}>
                  Enquire about the {product.name}
                </h2>
              </div>
              <EnquiryForm modelContext={{ productId: product.id, name: product.name }} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
