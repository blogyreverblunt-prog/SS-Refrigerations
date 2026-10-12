/**
 * Industries & Applications — one page, six anchored sections.
 *
 * Not six routes. The benchmark is explicit about why (PURE-PLAY-BENCHMARK.md
 * §4.1): Victory and Hussmann can afford a page per segment because they have
 * installations to put on it. Six thin pages read as a dead company; one page
 * that answers six buyers does not.
 *
 * Every block ends in the same place — the enquiry — with the industry
 * carried in the URL so the sales desk knows which door the lead came
 * through.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHero, PageSection } from "@/components/page-shell";
import { ArrowRight } from "@/components/icons";
import { INDUSTRIES } from "@/content/industries";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Refrigeration for restaurants and QSR, bakery and patisserie, supermarket and retail, hotels and institutional kitchens, healthcare and pharma, and ice cream, dairy and beverage.",
};

const ANCHORS = INDUSTRIES.map((i) => ({
  href: `#${i.slug}`,
  label: i.name.split(/[,&]/)[0]?.trim() ?? i.name,
}));

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title={<>Six businesses.<br />One cold chain.</>}
        lead="Nobody buys a cabinet; they solve a problem that happens to be cold. Find the business you run, and the shortlist is three products long instead of thirty."
        actions={
          <>
            <Link className="btn btn--primary" href="/contact#enquiry">
              Talk to an expert <ArrowRight />
            </Link>
            <Link className="btn btn--ghost" href="/products">
              Browse the full range
            </Link>
          </>
        }
        anchors={ANCHORS}
      />

      {INDUSTRIES.map((ind, i) => (
        <PageSection key={ind.slug} id={ind.slug}>
          <div className={i % 2 === 1 ? "ind ind--flip" : "ind"}>
            <div className="ind__media">
              <Image
                src={ind.photo}
                alt=""
                width={800}
                height={600}
                sizes="(max-width: 1024px) 90vw, 520px"
              />
            </div>

            <div className="ind__copy">
              <p className="eyebrow">Industry {String(i + 1).padStart(2, "0")}</p>
              <h2 className="h3">{ind.name}</h2>
              <p className="small">{ind.problem}</p>

              <ul className="stack" style={{ gap: "var(--s-2)" }}>
                {ind.needs.map((n) => (
                  <li className="small" key={n} style={{ color: "var(--ink-2)" }}>
                    — {n}
                  </li>
                ))}
              </ul>

              <div className="chips">
                <span className="chip chip--accent">{ind.band}</span>
              </div>

              <div className="cards">
                {ind.products.map((p) => (
                  <Link className="card" href={`/products/${p.slug}`} key={p.slug}>
                    <span className="card__title">{p.label}</span>
                    <span className="link link--accent">
                      View models <ArrowRight size={12} />
                    </span>
                  </Link>
                ))}
              </div>

              <div className="phero__actions">
                <Link
                  className="btn btn--primary"
                  href={`/contact?industry=${ind.slug}#enquiry`}
                >
                  Request a quote <ArrowRight />
                </Link>
                <Link className="btn btn--ghost" href="/support">
                  Service &amp; AMC
                </Link>
              </div>
            </div>
          </div>
        </PageSection>
      ))}

      <PageSection
        eyebrow="Not on the list?"
        title="If it has to stay cold, ask anyway."
        lead="Dairies, laboratories, florists, mortuaries, catering fleets — the same cabinets and cold rooms serve all of them. Tell us the load, the ambient and the hours, and we will specify against it."
      >
        <div className="phero__actions">
          <Link className="btn btn--primary" href="/contact#enquiry">
            Describe your requirement <ArrowRight />
          </Link>
          <Link className="btn btn--ghost" href="/downloads">
            Download the catalogue
          </Link>
        </div>
      </PageSection>
    </>
  );
}
