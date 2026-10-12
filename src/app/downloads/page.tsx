/**
 * Downloads — the resource centre.
 *
 * Kitchen consultants, architects and tender teams need documents, not web
 * pages, and omitting the spec sheet is the single most common reason a B2B
 * refrigeration enquiry does not happen.
 *
 * Two structural decisions, both taken from the pure-play sample
 * (PURE-PLAY-BENCHMARK.md §3.6, §4.5):
 *
 *  - Downloads are a TAXONOMY, not a list. Zero Zone splits "helpful" from
 *    "technical"; Everest splits by audience. `DOCUMENT_KIND` already encodes
 *    seven kinds, so the split is free.
 *  - Nothing is gated. Foster and Tefcold put their price list and media bank
 *    behind a dealer login, which is a different, later layer — gating a spec
 *    sheet costs leads today.
 *
 * The list is server-rendered from the `document` table. Until the media
 * module and R2 are wired, that table is empty — so the page renders the
 * taxonomy with an honest empty state per group rather than fake rows.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { ArrowRight, Download, FileText } from "@/components/icons";
import { container } from "@/lib/container";
import type { DocumentRow, ProductListItem } from "@/modules/catalog";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Downloads",
  description:
    "Product catalogue, spec sheets, installation and operation manuals, brochures, certificates, warranty statements and CAD files.",
};

/** The `document.kind` enum, grouped the way a visitor thinks about it. */
const GROUPS = [
  {
    id: "technical",
    eyebrow: "Technical",
    title: "For the person specifying the cabinet",
    lead: "Dimensions, loads, clearances and drawings — what a kitchen consultant or a tender team needs to put the unit on a drawing.",
    kinds: [
      { kind: "spec_sheet", label: "Spec sheets", note: "One per model code" },
      { kind: "manual", label: "Installation & operation manuals", note: "Per range" },
      { kind: "cad", label: "CAD / Revit / BIM", note: "DWG front, plan and side; RFA" },
    ],
  },
  {
    id: "commercial",
    eyebrow: "Commercial",
    title: "For the person signing the purchase order",
    lead: "The catalogue, the brochures, the certificates and the warranty statement — the documents that go into a file and get forwarded internally.",
    kinds: [
      { kind: "catalogue", label: "Full product catalogue", note: "The whole range, one PDF" },
      { kind: "brochure", label: "Range brochures", note: "Per family" },
      { kind: "certificate", label: "Certificates", note: "ISO, BIS, CE, test reports" },
      { kind: "warranty", label: "Warranty statements", note: "Per range" },
    ],
  },
] as const;

function kindLabel(kind: string): string {
  for (const g of GROUPS) {
    const hit = g.kinds.find((k) => k.kind === kind);
    if (hit) return hit.label;
  }
  return kind.replace(/_/g, " ");
}

/**
 * One row per document, or one honest line per kind when the table is still
 * empty. An empty state that names the file you are looking for and offers a
 * person is worth more than a page that pretends to have it.
 */
function DocRows({ docs, kind }: { docs: readonly DocumentRow[]; kind: string }) {
  const rows = docs.filter((d) => d.kind === kind);

  if (rows.length === 0) {
    return (
      <div className="dl__row">
        <span className="dl__icon"><FileText /></span>
        <span>
          <span className="dl__title">{kindLabel(kind)}</span>
          <span className="dl__meta">
            Not uploaded yet <Tmpl label="upload" />
          </span>
        </span>
        <Link className="btn btn--ghost" href="/contact#enquiry">Ask for it</Link>
      </div>
    );
  }

  return (
    <>
      {rows.map((d) => (
        <div className="dl__row" key={d.id}>
          <span className="dl__icon"><FileText /></span>
          <span>
            <span className="dl__title">{d.title}</span>
            <span className="dl__meta">{kindLabel(d.kind)}</span>
          </span>
          {/*
            `storageKey` is an object-storage KEY, not a URL. Once the media
            module publishes absolute CDN URLs the row links straight to the
            file; until then the row is listed and the button is honest
            rather than pointing at a route that does not exist.
          */}
          {d.storageKey.startsWith("http") ? (
            <a className="btn btn--ghost" href={d.storageKey}>
              Download <Download />
            </a>
          ) : (
            <button className="btn btn--ghost" type="button" disabled>
              Upload pending <Download />
            </button>
          )}
        </div>
      ))}
    </>
  );
}

export default async function DownloadsPage() {
  const repo = container.catalogRepo();

  // Documents attach per RANGE wherever possible, not per SKU — that is what
  // keeps the object store at ~80 PDFs instead of 700 (HLD-FREE-TIER §2.3).
  const products: ProductListItem[] = await repo.listLive(24);
  const perProduct = await Promise.all(
    products.map(async (p) => {
      const detail = await repo.findProductBySlug(p.slug);
      return { product: p, docs: detail.documents };
    }),
  );
  const docs: DocumentRow[] = perProduct.flatMap((x) => [...x.docs]);

  return (
    <>
      <PageHero
        eyebrow="Downloads"
        title={<>Spec sheets, manuals,<br />drawings and certificates.</>}
        lead="Everything here is also linked from the product it belongs to. This page is the index for people who arrived looking for a document rather than for a cabinet — and nothing on it is behind a form."
        actions={
          <>
            <Link className="btn btn--primary" href="#commercial">
              Full product catalogue <Download />
            </Link>
            <Link className="btn btn--ghost" href="/products">
              Browse products instead
            </Link>
          </>
        }
        anchors={[
          { href: "#technical", label: "Technical" },
          { href: "#commercial", label: "Commercial" },
          { href: "#by-product", label: "By product" },
        ]}
      />

      {GROUPS.map((g) => (
        <PageSection key={g.id} id={g.id} eyebrow={g.eyebrow} title={g.title} lead={g.lead}>
          <div className="pills">
            {g.kinds.map((k) => (
              <span className="pill" key={k.kind}>{k.label}</span>
            ))}
          </div>
          <div className="dl">
            {g.kinds.map((k) => (
              <DocRows key={k.kind} docs={docs} kind={k.kind} />
            ))}
          </div>
        </PageSection>
      ))}

      {/* ----------------------------------------------------- by product */}
      <PageSection
        id="by-product"
        eyebrow="By product"
        title="Or start from the cabinet."
        lead="Each family page carries its own spec sheet, manual and drawing alongside the model table — which is where most people would rather start."
      >
        <div className="cards">
          {products.map((p) => {
            const count = perProduct.find((x) => x.product.id === p.id)?.docs.length ?? 0;
            return (
              <Link className="card" href={`/products/${p.slug}`} key={p.id}>
                <span className="card__icon"><FileText /></span>
                <h3 className="card__title">{p.name}</h3>
                <p>
                  {count > 0
                    ? `${count} document${count === 1 ? "" : "s"} on the product page`
                    : "Documents are being prepared for this range."}
                </p>
                <span className="link link--accent">
                  Open the range <ArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Can't find it?"
        title="Ask, and we will send it."
        lead="If a document is not on this page it either does not exist yet or it is model-specific. Either way, one line to the sales desk is faster than hunting."
      >
        <div className="phero__actions">
          <Link className="btn btn--primary" href="/contact#enquiry">
            Request a document <ArrowRight />
          </Link>
          <Link className="btn btn--ghost" href="/support">
            Service &amp; support
          </Link>
        </div>
      </PageSection>
    </>
  );
}
