/**
 * /sitemap — the human one.
 *
 * There are two sitemaps on a site and they are not interchangeable:
 *
 *   · /sitemap.xml is a machine file. Google and Bing read it, it is declared
 *     in robots.txt, and it is generated next door in src/app/sitemap.ts. No
 *     visitor should ever be sent to it — a footer link labelled "Sitemap"
 *     that opens raw XML looks like a broken page.
 *   · this page is the one a person clicks: every page on the site, grouped,
 *     with the in-page sections that are worth linking to directly.
 *
 * Both of the reference sites that publish one do exactly this split —
 * u-line.com/sitemap and marvelrefrigeration.com/sitemap are HTML pages,
 * while their XML lives at /sitemap.xml.
 *
 * The product list is read from the database rather than typed out, for the
 * same reason sitemap.ts reads it: a hand-maintained list goes stale the
 * first time a range is published, and a sitemap that lies is worse than no
 * sitemap.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection } from "@/components/page-shell";
import { ArrowRight } from "@/components/icons";
import { site } from "@/content/site";
import { container } from "@/lib/container";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Sitemap",
  description:
    "Every page on this website, grouped: products, industries, service and support, downloads, company and legal.",
};

interface Entry {
  readonly href: string;
  readonly label: string;
  /** One line, where the label alone does not say what the page is for. */
  readonly note?: string;
}

interface Group {
  readonly title: string;
  readonly entries: readonly Entry[];
}

/** Everything that is not read from the database. */
const STATIC_GROUPS: readonly Group[] = [
  {
    title: "Browse",
    entries: [
      { href: "/", label: "Home" },
      { href: "/products", label: "All products" },
      { href: "/compare", label: "Compare models", note: "Two cabinets side by side" },
      { href: "/industries", label: "Industries", note: "Which cabinet suits which kitchen" },
      { href: "/downloads", label: "Downloads", note: "Spec sheets, manuals, certificates, CAD" },
    ],
  },
  {
    title: "Service & support",
    entries: [
      { href: "/support", label: "Service & support" },
      { href: "/support#helpline", label: "Helpline" },
      { href: "/support#request", label: "Log a service request" },
      { href: "/support#amc", label: "AMC & maintenance plans" },
      { href: "/support#warranty", label: "Warranty terms" },
      { href: "/support#register", label: "Register a product" },
      { href: "/support#install", label: "Installation & site survey" },
      { href: "/support#network", label: "Service network" },
      { href: "/support#safety", label: "Safety notices" },
      { href: "/support#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company & contact",
    entries: [
      { href: "/about", label: "About us" },
      { href: "/about#certifications", label: "Certifications" },
      { href: "/contact", label: "Contact" },
      { href: "/contact#enquiry", label: "Request a quote" },
      { href: "/contact#write", label: "Who to write to" },
      { href: "/contact#offices", label: "Offices" },
      { href: "/contact#dealership", label: "Become a dealer" },
      { href: "/contact#grievance", label: "Grievances" },
    ],
  },
  {
    title: "Your account",
    entries: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create an account" },
      { href: "/account", label: "Your account", note: "Sign-in required" },
    ],
  },
  {
    title: "Legal",
    entries: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/cookies", label: "Cookie policy" },
      { href: "/terms", label: "Terms of use" },
      { href: "/terms#ewaste", label: "E-waste" },
      { href: "/terms#law", label: "Governing law" },
    ],
  },
];

export default async function SitemapPage() {
  const products = await container.catalogRepo().listLive(24);

  const groups: Group[] = [
    STATIC_GROUPS[0]!,
    {
      title: "Products",
      entries: products.map((p) => ({ href: `/products/${p.slug}`, label: p.name })),
    },
    ...STATIC_GROUPS.slice(1),
  ];

  return (
    <>
      <PageHero
        eyebrow="Sitemap"
        title="Every page on this site."
        lead={`${site.brand.name} in one list — the catalogue, the support pages, the company details and the legal notices, with the sections worth linking to directly.`}
      />

      <PageSection>
        <div className="cards cards--3">
          {groups.map((g) => (
            <article className="card" key={g.title}>
              <h2 className="card__title">{g.title}</h2>
              <ul className="sitemap-list">
                {g.entries.map((e) => (
                  <li key={e.href}>
                    <Link href={e.href}>{e.label}</Link>
                    {e.note && <span className="sitemap-list__note">{e.note}</span>}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="For search engines"
        title="The machine-readable version."
        lead="Not for reading. These exist so Google and Bing can find every page without crawling the site blind, and they are kept in step with the list above automatically."
      >
        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">XML sitemap</span>
            <span className="rows__v">
              <a href="/sitemap.xml">/sitemap.xml</a> — every live page with its last-modified
              date, generated from the database
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Crawl rules</span>
            <span className="rows__v">
              <a href="/robots.txt">/robots.txt</a> — declares the sitemap, and keeps crawlers
              out of the API and the compare permutations
            </span>
          </div>
        </div>
        <p className="small">
          Looking for something that is not here?{" "}
          <Link className="link link--accent" href="/contact#enquiry">
            Ask us <ArrowRight size={12} />
          </Link>
        </p>
      </PageSection>
    </>
  );
}
