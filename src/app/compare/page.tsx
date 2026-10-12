/**
 * Compare — model codes side by side.
 *
 * Turbo Air is the only site in either sample with a compare basket, and
 * none of the thirty has a good comparison table — which makes this the
 * cheapest page on the site to be best at. Everything it needs is already in
 * `product_variant`.
 *
 * The page itself stays STATIC: the whole live catalogue is flattened into
 * props at build time and the selection is resolved in the browser from the
 * query string (see components/compare-table.tsx). Reading `searchParams`
 * here instead would make the route dynamic and put a database read behind
 * every visitor.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHero } from "@/components/page-shell";
import { CompareTable, type CompareFamily } from "@/components/compare-table";
import { ArrowRight } from "@/components/icons";
import { container } from "@/lib/container";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Compare models",
  description:
    "Put up to four model codes side by side — capacity, temperature range, refrigerant, power, dimensions and price — then send the shortlist as one enquiry.",
};

const num = (v: string | null) => (v === null ? null : Number(v));

export default async function ComparePage() {
  const repo = container.catalogRepo();
  const products = await repo.listLive(24);
  const details = await Promise.all(products.map((p) => repo.findProductBySlug(p.slug)));

  const families: CompareFamily[] = details.map((d) => ({
    slug: d.slug,
    name: d.name,
    models: d.variants.map((v) => ({
      id: v.id,
      modelCode: v.modelCode,
      productSlug: d.slug,
      productName: d.name,
      capacityL: num(v.capacityL),
      tempMinC: num(v.tempMinC),
      tempMaxC: num(v.tempMaxC),
      refrigerant: v.refrigerant,
      powerW: v.powerW,
      dims: (v.dimsMm as { w?: number; d?: number; h?: number } | null) ?? null,
      mrpInr: num(v.mrpInr),
    })),
  }));

  return (
    <>
      <PageHero
        eyebrow="Compare"
        title={<>Put the shortlist<br />side by side.</>}
        lead="Pick up to four model codes. The rows where they differ are highlighted, and the whole comparison is one link you can send to whoever signs the order."
        actions={
          <>
            <Link className="btn btn--primary" href="/products">
              Browse the range <ArrowRight />
            </Link>
            <Link className="btn btn--ghost" href="/contact#enquiry">
              Ask us to shortlist
            </Link>
          </>
        }
      />

      {/*
        useSearchParams() needs a Suspense boundary on a statically rendered
        route: the shell is prerendered, the selection resolves on hydration.
      */}
      <Suspense
        fallback={
          <section className="section">
            <div className="container">
              <div className="panel blk">
                <p className="small">Loading the model list…</p>
              </div>
            </div>
          </section>
        }
      >
        <CompareTable families={families} />
      </Suspense>
    </>
  );
}
