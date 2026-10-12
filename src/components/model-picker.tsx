"use client";

/**
 * The product page, as a chooser.
 *
 * The buyer's question is never "what is a reach-in refrigerator" — they
 * arrived knowing that. It is "which of these two". So the family page leads
 * with the model list, and the specification, the drawing, the spec sheet and
 * the quote all follow the selection
 * (docs/ia/PURE-PLAY-BENCHMARK.md §4, option C).
 *
 * Why this is one client component rather than three:
 *
 *  - The selection has to reach the enquiry form, or "Request a quote" means
 *    "someone wants a reach-in" instead of "someone wants two HR-128MA-S".
 *    Shared state means one React tree.
 *  - The page's other sections — the full specification table, warranty,
 *    related models — are passed in as `children` and stay SERVER
 *    components. They render on the server, inside this component's tree,
 *    which is why the HTML a crawler sees is still complete.
 *  - The selection is deliberately NOT in the URL. `/compare` puts it there
 *    because a comparison is a thing you send someone; a product page is not,
 *    and reading `searchParams` here would make the route dynamic — a
 *    database read per visitor, which is the one thing the ISR-only rule
 *    exists to prevent (HLD-FREE-TIER.md §4.1).
 */
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { ArrowRight, Chat, Download, FileText, Phone, Scale, Shield } from "./icons";
import { EnquiryForm } from "./enquiry-form";
import { Tmpl } from "./page-shell";
import { SiteHeader } from "./site-header";

/** A variant, flattened — it crosses the server/client boundary. */
export interface PickerModel {
  readonly id: string;
  readonly modelCode: string;
  readonly capacityL: number | null;
  readonly tempMinC: number | null;
  readonly tempMaxC: number | null;
  readonly refrigerant: string | null;
  readonly powerW: number | null;
  readonly dims: { w?: number; d?: number; h?: number } | null;
  readonly mrpInr: number | null;
  /** Sub-type for this model, where the family declares them in order. */
  readonly subType: string | null;
}

export interface PickerDoc {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly storageKey: string;
}

interface Props {
  readonly product: {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
    readonly series: string | null;
    readonly summary: string | null;
  };
  readonly image: string;
  readonly models: readonly PickerModel[];
  readonly subTypes: readonly string[];
  readonly docs: readonly PickerDoc[];
  readonly warranty: { readonly parts: string; readonly compressor: string; readonly labour: string };
  readonly salesPhone: string;
  readonly salesTel: string;
  readonly whatsapp: string;
  readonly serviceCities: number;
  readonly unavailable: boolean;
  /** Server-rendered sections, placed between the picker and the enquiry. */
  readonly children: ReactNode;
  /** Turnstile site key, forwarded to the enquiry form. */
  readonly turnstileSiteKey?: string | undefined;
}

/* ---------------------------------------------------------------- format */

const capShort = (m: PickerModel) => (m.capacityL === null ? "—" : `${m.capacityL} L`);

const capFull = (m: PickerModel) =>
  m.capacityL === null ? "—" : `${m.capacityL} L · ${(m.capacityL * 0.0353147).toFixed(1)} cu ft`;

const temp = (m: PickerModel) =>
  m.tempMinC === null || m.tempMaxC === null ? "—" : `${m.tempMinC} to ${m.tempMaxC} °C`;

const dims = (m: PickerModel) =>
  m.dims?.w && m.dims.d && m.dims.h ? `${m.dims.w} × ${m.dims.d} × ${m.dims.h} mm` : "—";

const power = (m: PickerModel) => (m.powerW ? `${m.powerW} W · 230 V 50 Hz` : "—");

const price = (m: PickerModel) =>
  m.mrpInr === null ? "Priced per site" : `₹${m.mrpInr.toLocaleString("en-IN")} + GST`;

/* ------------------------------------------------------------------ view */

export function ModelPicker({
  product,
  image,
  models,
  subTypes,
  docs,
  warranty,
  salesPhone,
  salesTel,
  whatsapp,
  serviceCities,
  unavailable,
  children,
  turnstileSiteKey,
}: Props) {
  const [pickedId, setPickedId] = useState<string>(models[0]?.id ?? "");
  const [compare, setCompare] = useState<readonly string[]>([]);

  const sel = models.find((m) => m.id === pickedId) ?? models[0];

  const toggleCompare = (code: string) =>
    setCompare((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

  const compareHref = compare.length > 0 ? `/compare?m=${compare.join(",")}` : "/compare";
  const specSheet = docs.find((d) => d.kind === "spec_sheet");
  const cad = docs.find((d) => d.kind === "cad");

  return (
    <>
      <div className="section">
        <div className="container">
          <div className="panel">
            {/* The nav shares this card with the family header, exactly as it
                shares one with the hero on every other page. */}
            <SiteHeader />

            {/* ---------------------------------------------- family header */}
            <div className="phero" style={{ paddingBottom: "var(--s-6)" }}>
              <nav className="crumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link><span>/</span>
                <Link href="/products">Products</Link><span>/</span>
                <span style={{ color: "var(--ink)" }}>{product.name}</span>
              </nav>
              <h1 className="pdp__title">{product.name}</h1>
              {product.series && <p className="eyebrow">{product.series}</p>}
              <p className="measure" style={{ maxWidth: "62ch" }}>{product.summary}</p>
              {subTypes.length > 0 && (
                <div className="chips">
                  {subTypes.map((t) => <span className="chip" key={t}>{t}</span>)}
                </div>
              )}
            </div>

            {unavailable && (
              <div style={{ padding: "0 var(--s-6) var(--s-6)" }}>
                <p className="notice notice--err" role="note">
                  <strong>Regional availability</strong>
                  This family is not currently supplied in this market. Contact us to
                  discuss alternatives.
                </p>
              </div>
            )}

            {/* ------------------------------------------------- the picker */}
            <div className="picker">
              {/* left: choose a model */}
              <div className="picker__col">
                <p className="eyebrow">
                  Choose a model · {models.length}{" "}
                  {models.length === 1 ? "model" : "models"}
                </p>

                <div className="picker__list" role="group" aria-label="Model codes">
                  {models.map((m) => (
                    <button
                      className="picker__row"
                      type="button"
                      key={m.id}
                      aria-pressed={m.id === sel?.id}
                      onClick={() => setPickedId(m.id)}
                    >
                      <span className="picker__head">
                        <span className="picker__code">{m.modelCode}</span>
                        <span className="picker__cap">{capShort(m)}</span>
                      </span>
                      <span className="picker__sub">
                        {m.subType ? `${m.subType} · ` : ""}{temp(m)}
                      </span>
                    </button>
                  ))}
                  {models.length === 0 && (
                    <p className="small">No model codes published for this family yet.</p>
                  )}
                </div>

                {models.length > 1 && (
                  <div className="rail__split">
                    <p className="eyebrow">Build a shortlist</p>
                    <div className="checks">
                      {models.map((m) => (
                        <label className="check" key={m.id}>
                          <input
                            type="checkbox"
                            checked={compare.includes(m.modelCode)}
                            onChange={() => toggleCompare(m.modelCode)}
                          />
                          <strong>{m.modelCode}</strong>
                          <span className="check__cap">{capShort(m)}</span>
                        </label>
                      ))}
                    </div>
                    <Link className="btn btn--ghost btn--block" href={compareHref}>
                      <Scale size={14} />
                      {compare.length > 1
                        ? `Compare ${compare.length} models`
                        : "Pick two to compare"}
                    </Link>
                  </div>
                )}

                <div className="rail__split">
                  <p className="eyebrow">Not sure?</p>
                  <p className="small">
                    Tell us the load, the ambient and the hours it runs, and we will
                    shortlist two with the reasons.
                  </p>
                  <Link className="link link--accent" href="#enquire">
                    Ask for a shortlist <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {/* middle: the selected model */}
              <div className="picker__col">
                <div className="picker__media">
                  <Image
                    src={image}
                    alt={`${product.name}${sel ? ` — ${sel.modelCode}` : ""}`}
                    width={1295}
                    height={1020}
                    priority
                    sizes="(max-width: 760px) 90vw, (max-width: 1024px) 60vw, 520px"
                  />
                </div>

                {sel && (
                  <>
                    <div className="picker__title">
                      <h2 className="h3">{sel.modelCode}</h2>
                      {sel.subType && <span className="chip chip--accent">{sel.subType}</span>}
                      <span className="small">{product.name}</span>
                    </div>

                    {/* At a glance, metric first, for the selected model. */}
                    <dl className="glance">
                      <div><dt>Capacity</dt><dd>{capFull(sel)}</dd></div>
                      <div><dt>Temperature</dt><dd>{temp(sel)}</dd></div>
                      <div><dt>Refrigerant</dt><dd>{sel.refrigerant ?? "—"}</dd></div>
                      <div><dt>W × D × H</dt><dd>{dims(sel)}</dd></div>
                      <div><dt>Power</dt><dd>{power(sel)}</dd></div>
                      <div><dt>Ambient</dt><dd>up to 43 °C</dd></div>
                    </dl>

                    <div className="cards cards--2">
                      <div className="card">
                        <p className="eyebrow">Cabinet</p>
                        <p>
                          SS 304 inside and out · [INSULATION] mm injected PUF ·
                          field-reversible door with lock · [N] adjustable shelves ·
                          100 mm castors <Tmpl label="confirm" />
                        </p>
                      </div>
                      <div className="card">
                        <p className="eyebrow">Refrigeration system</p>
                        <p>
                          {sel.refrigerant ?? "Natural refrigerant"} · [COMPRESSOR]
                          hermetic compressor · automatic defrost · epoxy-coated
                          evaporator · digital controller with alarm <Tmpl label="confirm" />
                        </p>
                      </div>
                    </div>

                    {/* Documents for the model in hand, not for the catalogue. */}
                    <div id="downloads" className="dl">
                      <div className="dl__row">
                        <span className="dl__icon"><FileText /></span>
                        <span>
                          <span className="dl__title">Spec sheet — {sel.modelCode}</span>
                          <span className="dl__meta">
                            {specSheet?.storageKey.startsWith("http")
                              ? "PDF"
                              : <>Not uploaded yet <Tmpl label="upload" /></>}
                          </span>
                        </span>
                        {specSheet?.storageKey.startsWith("http") ? (
                          <a className="btn btn--ghost" href={specSheet.storageKey}>
                            Download <Download />
                          </a>
                        ) : (
                          <Link className="btn btn--ghost" href="#enquire">Ask for it</Link>
                        )}
                      </div>
                      <div className="dl__row">
                        <span className="dl__icon"><FileText /></span>
                        <span>
                          <span className="dl__title">CAD drawing — {sel.modelCode}</span>
                          <span className="dl__meta">
                            {cad?.storageKey.startsWith("http")
                              ? "DWG · front, plan, side"
                              : <>Not uploaded yet <Tmpl label="upload" /></>}
                          </span>
                        </span>
                        {cad?.storageKey.startsWith("http") ? (
                          <a className="btn btn--ghost" href={cad.storageKey}>
                            Download <Download />
                          </a>
                        ) : (
                          <Link className="btn btn--ghost" href="#enquire">Ask for it</Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* right: the quote rail, pinned to the selection */}
              <div className="picker__col picker__rail">
                <div className="rail">
                  <div className="rail__card">
                    <p className="eyebrow">Quoting</p>
                    <p className="rail__price">{sel?.modelCode ?? product.name}</p>
                    {sel && (
                      <p className="small">
                        {capFull(sel)} · {temp(sel)}
                      </p>
                    )}
                    <p className="price-slot">{sel ? price(sel) : "Priced per site"}</p>
                    <Link className="btn btn--primary btn--block" href="#enquire">
                      Request a Quote <ArrowRight />
                    </Link>
                    <Link className="btn btn--ghost btn--block" href="#downloads">
                      Spec sheet <Download />
                    </Link>
                    <p className="small">
                      No price shown: freight, installation and voltage stabilisation
                      all move it. Reply within one working day.
                    </p>
                    <div className="rail__split">
                      <a className="link" href={salesTel}>
                        <Phone size={14} /> {salesPhone}
                      </a>
                      <a className="link link--accent" href={whatsapp}>
                        <Chat size={12} /> WhatsApp us
                      </a>
                    </div>
                  </div>

                  <div className="rail__card rail__card--soft">
                    <p className="eyebrow">Warranty</p>
                    <p className="rail__price">
                      {warranty.parts} parts · {warranty.compressor} compressor
                    </p>
                    <p className="small">
                      {warranty.labour} labour · engineers in {serviceCities} cities ·
                      AMC available
                    </p>
                    <Link className="link link--accent" href="/support#warranty">
                      Terms and AMC plans <ArrowRight size={12} />
                    </Link>
                  </div>

                  <div className="rail__card">
                    <p className="eyebrow">Before it arrives</p>
                    <p className="small">
                      {sel?.dims?.w
                        ? `${sel.dims.w} mm wide needs a ${sel.dims.w + 50} mm doorway — measure the route in, not the gap it goes into.`
                        : "Measure the route in, not the gap it goes into: doorways, the lift car and every staircase turn."}
                    </p>
                    <Link className="link link--accent" href="/support#install">
                      Site survey list <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The server-rendered sections: full spec table, service, related. */}
      {children}

      {/* ------------------------------------------------ inline enquiry */}
      <section className="section" id="enquire">
        <div className="container">
          <div className="panel" style={{ padding: "var(--s-8) var(--s-6)" }}>
            <div className="split">
              <div style={{ display: "grid", gap: "var(--s-6)" }}>
                <div>
                  <p className="eyebrow">Request a quote</p>
                  <h2 className="h3" style={{ marginTop: "var(--s-2)" }}>
                    {sel ? `Enquire about the ${sel.modelCode}` : `Enquire about the ${product.name}`}
                  </h2>
                  <p className="small" style={{ marginTop: "var(--s-2)" }}>
                    The model you picked above is already on this enquiry. Change the
                    selection and the line item changes with it.
                  </p>
                </div>
                <EnquiryForm
                  modelContext={{ productId: product.id, name: product.name }}
                  variantContext={
                    sel ? { variantId: sel.id, modelCode: sel.modelCode } : undefined
                  }
                  turnstileSiteKey={turnstileSiteKey}
                />
              </div>

              <div className="aside">
                <div className="rows">
                  <div className="rows__row">
                    <span className="rows__k">Model</span>
                    <span className="rows__v">{sel?.modelCode ?? "—"}</span>
                  </div>
                  <div className="rows__row">
                    <span className="rows__k">Sales</span>
                    <span className="rows__v">
                      <a href={salesTel}>{salesPhone}</a> <Tmpl />
                    </span>
                  </div>
                  <div className="rows__row">
                    <span className="rows__k">Response</span>
                    <span className="rows__v">within one working day</span>
                  </div>
                  <div className="rows__row">
                    <span className="rows__k">Lead time</span>
                    <span className="rows__v">Quoted with the price <Tmpl label="confirm" /></span>
                  </div>
                </div>
                <div className="card">
                  <span className="card__icon"><Shield /></span>
                  <h3 className="card__title">What happens next</h3>
                  <p>
                    We check the ambient, the supply and the opening the cabinet has to
                    pass through, then quote. No configurator, no automated price — a
                    cabinet specified wrong is a warranty claim waiting to happen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- phone: the rail, reduced to one tap */}
      <div className="actionbar">
        <div className="actionbar__meta">
          <strong>{sel?.modelCode ?? product.name}</strong>
          <span>{sel ? `${capShort(sel)} · priced per site` : "Priced per site"}</span>
        </div>
        <div className="actionbar__row">
          <Link className="btn btn--primary" href="#enquire">Quote this model</Link>
          <a className="btn btn--ghost" href={whatsapp}>WhatsApp</a>
        </div>
      </div>
      <div className="actionbar__spacer" aria-hidden="true" />
    </>
  );
}
