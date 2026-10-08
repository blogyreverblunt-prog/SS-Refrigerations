/**
 * Catalogue hub. Answers "do you even make the thing I need?" in one
 * screen — a six-card grid, because a flat list of model codes is unusable
 * (docs/ia/SITE-SECTIONS-REPORT.md §2).
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { container } from "@/lib/container";
import { SiteHeader } from "@/components/site-header";
import { ArrowRight } from "@/components/icons";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Reach-in and undercounter cabinets, glass-door merchandisers, display cases, deep freezers and walk-in cold rooms.",
};

export default async function ProductsPage() {
  const products = await container.catalogRepo().listLive(24);

  return (
    <div className="section">
      <div className="container">
        <div className="panel">
          <SiteHeader />

          <section className="features" style={{ gridTemplateColumns: "1fr" }}>
            <div className="features__intro">
              <p className="eyebrow">The range</p>
              <h1 className="h2">Commercial refrigeration,<br />six families.</h1>
              <p className="small measure">
                Every cabinet is specified for Indian ambient conditions and quoted
                per site. Capacities in litres, dimensions in millimetres.
              </p>
            </div>

            <div className="showcase" style={{ gridColumn: "1 / -1" }}>
              {products.map((p) => (
                <article className="panel show" key={p.id}>
                  <div className="show__body">
                    <h2 className="show__title">{p.name}</h2>
                    <p>{p.summary?.slice(0, 110)}…</p>
                    <Link className="link link--accent" href={`/products/${p.slug}`}>
                      View models <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="show__media">
                    <Image src={`/products/${p.slug}.jpg`} alt={p.name} fill
                           sizes="(max-width: 420px) 100vw, (max-width: 760px) 38vw, 170px" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
