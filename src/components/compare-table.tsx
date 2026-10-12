"use client";

/**
 * The compare basket's interactive half.
 *
 * It is a client component for one reason: the selection lives in the URL
 * (`/compare?m=HR-78MA-S,HR-128MA-S`), and reading a query string on the
 * server would make the route dynamic — which means a database read per
 * visitor, the exact thing the HLD's ISR-only rule exists to prevent
 * (HLD-FREE-TIER.md §4.1).
 *
 * So the server renders every live model into this component's props at
 * build time, and the selection is resolved here, in the browser, for free.
 * The URL stays shareable and crawlable either way.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ArrowRight, Scale } from "./icons";

/** Flattened variant — serialisable, because it crosses the server boundary. */
export interface CompareModel {
  readonly id: string;
  readonly modelCode: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly capacityL: number | null;
  readonly tempMinC: number | null;
  readonly tempMaxC: number | null;
  readonly refrigerant: string | null;
  readonly powerW: number | null;
  readonly dims: { w?: number; d?: number; h?: number } | null;
  readonly mrpInr: number | null;
}

export interface CompareFamily {
  readonly slug: string;
  readonly name: string;
  readonly models: readonly CompareModel[];
}

/** Four columns is the most that stays readable on a laptop. */
const MAX = 4;

const ROWS: readonly { label: string; value: (m: CompareModel) => string }[] = [
  {
    label: "Capacity",
    value: (m) =>
      m.capacityL === null ? "—" : `${m.capacityL} L · ${(m.capacityL * 0.0353147).toFixed(1)} cu ft`,
  },
  {
    label: "Temperature range",
    value: (m) =>
      m.tempMinC === null || m.tempMaxC === null ? "—" : `${m.tempMinC} to ${m.tempMaxC} °C`,
  },
  { label: "Refrigerant", value: (m) => m.refrigerant ?? "—" },
  { label: "Power", value: (m) => (m.powerW ? `${m.powerW} W` : "—") },
  {
    label: "W × D × H",
    value: (m) =>
      m.dims?.w && m.dims.d && m.dims.h ? `${m.dims.w} × ${m.dims.d} × ${m.dims.h} mm` : "—",
  },
  {
    label: "Price",
    value: (m) => (m.mrpInr === null ? "On request" : `₹${m.mrpInr.toLocaleString("en-IN")}`),
  },
];

const hrefFor = (codes: readonly string[]) =>
  codes.length > 0 ? `/compare?m=${codes.join(",")}` : "/compare";

export function CompareTable({ families }: { families: readonly CompareFamily[] }) {
  const params = useSearchParams();
  const all = families.flatMap((f) => f.models);

  const wanted = (params.get("m") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX);

  const picked = wanted
    .map((code) => all.find((m) => m.modelCode.toLowerCase() === code.toLowerCase()))
    .filter((m): m is CompareModel => Boolean(m));

  const codes = picked.map((m) => m.modelCode);

  /** A row only earns the highlight if the models genuinely disagree. */
  const differs = (row: (typeof ROWS)[number]) =>
    picked.length > 1 && new Set(picked.map((m) => row.value(m))).size > 1;

  return (
    <>
      {picked.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="panel blk">
              <div className="cmp-bar">
                <div className="band">
                  <p className="eyebrow">Side by side</p>
                  <h2 className="h3">What is actually different.</h2>
                </div>
                <div className="phero__actions">
                  <Link className="btn btn--primary" href="/contact#enquiry">
                    Quote all {picked.length} <ArrowRight />
                  </Link>
                  <Link className="btn btn--ghost" href="/compare">Clear</Link>
                </div>
              </div>

              <div className="table-wrap">
                <table className="spec-table">
                  <caption>Metric first — litres and millimetres, cu ft second.</caption>
                  <thead>
                    <tr>
                      <th scope="col">Specification</th>
                      {picked.map((m) => (
                        <th className="cmp-col" scope="col" key={m.id}>
                          {m.modelCode}
                          <span className="dl__meta" style={{ display: "block", fontWeight: 400 }}>
                            {m.productName}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => {
                      const diff = differs(row);
                      return (
                        <tr key={row.label}>
                          <th scope="row">{row.label}</th>
                          {picked.map((m) => (
                            <td className={diff ? "is-diff" : undefined} key={m.id}>
                              {row.value(m)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    <tr>
                      <th scope="row">Full specification</th>
                      {picked.map((m) => (
                        <td key={m.id}>
                          <Link className="link link--accent" href={`/products/${m.productSlug}`}>
                            Open page <ArrowRight size={12} />
                          </Link>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Remove</th>
                      {picked.map((m) => (
                        <td key={m.id}>
                          <Link
                            className="link link--accent"
                            href={hrefFor(codes.filter((c) => c !== m.modelCode))}
                          >
                            Remove column
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- the picker */}
      <section className="section">
        <div className="container">
          <div className="panel blk">
            <div className="band">
              <p className="eyebrow">{picked.length > 0 ? "Add another" : "Pick models"}</p>
              <h2 className="h3">
                {picked.length > 0 ? `Up to ${MAX} columns.` : "Every live model code."}
              </h2>
              <p className="small">
                Grouped by family. Adding a model appends it to the URL, so the
                comparison stays a plain link you can send to anyone.
              </p>
            </div>

            {families.map((f) => (
              <div className="stack" key={f.slug}>
                <p className="eyebrow">{f.name}</p>
                <div className="pills">
                  {f.models.map((m) => {
                    const already = codes.includes(m.modelCode);
                    const next = already
                      ? codes.filter((c) => c !== m.modelCode)
                      : [...codes, m.modelCode].slice(0, MAX);
                    return (
                      <Link
                        className="pill"
                        aria-current={already ? "true" : undefined}
                        href={hrefFor(next)}
                        key={m.id}
                        scroll={false}
                      >
                        {already ? "✓ " : "+ "}
                        {m.modelCode}
                      </Link>
                    );
                  })}
                  {f.models.length === 0 && (
                    <span className="small">No model codes published for this family yet.</span>
                  )}
                </div>
              </div>
            ))}

            {picked.length === 0 && (
              <div className="card" style={{ maxWidth: "46ch" }}>
                <span className="card__icon"><Scale /></span>
                <h3 className="card__title">Not sure which two to compare?</h3>
                <p>
                  Tell us the load, the ambient and the hours it runs, and we will send
                  a shortlist of two with the reasons.
                </p>
                <Link className="link link--accent" href="/contact#enquiry">
                  Ask for a shortlist <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
