# Pure-Play Refrigeration Benchmark — and build specs for the pages that do not exist yet

| | |
|---|---|
| **Status** | Rev 1.0, for review |
| **Date** | 2026-10-09 |
| **Questions answered** | (a) Which companies sell *only* refrigeration, and what does each one's website do well? (b) What exactly goes on the pages this repo has not built? |
| **Method** | 30 sites rendered and link-graphed in a real browser, 2026-10-09 |
| **Related** | [`SITE-SECTIONS-REPORT.md`](./SITE-SECTIONS-REPORT.md) — the earlier five-site audit. This document does not repeat it; it extends the sample to refrigeration-only companies and converts the findings into per-route build specs. |

---

## 1. Why a second audit

The first audit sampled five sites, three of which sell refrigeration **plus**
something else — Blue Star sells air conditioning and water purifiers, True and
Beverage-Air sell ice and bar equipment. A multi-category manufacturer organises its
site around *divisions*. That is the wrong model for us, because it hides the only
thing we sell behind a chooser.

So this round deliberately sampled companies whose entire business is cold: remove
refrigeration from them and nothing is left. Their sites have to make one product
category carry a whole navigation — exactly our problem.

What was checked per site: the full internal link graph from the homepage, plus the
on-page content of the page types we have not built — support hub, downloads, dealer
locator, FAQ, warranty, service network, calculator, compare.

---

## 2. The list — refrigeration-only websites

**Verdict column:** 🟢 sells refrigeration and nothing else · 🟡 refrigeration plus
one adjacent line (ice, bar dispense) · 🔴 looks comparable, is not.

### A. Foodservice cabinet manufacturers — our closest shape

| # | Site | Country | Range | | The one thing worth copying |
|---|---|---|---|:-:|---|
| 1 | [fosterrefrigerator.com](https://www.fosterrefrigerator.com/en) | UK | Cabinets, counters, blast chillers, multidecks, coldstores | 🟡 | Every range is tagged by **job**: `STORAGE` · `DISPLAY` · `PROCESS` · `PREP` · `FRONT OF HOUSE`. Plus a real `/product-finder` and a `/range-guide` headed by "Download product selection guide" |
| 2 | [williams-refrigeration.co.uk](https://www.williams-refrigeration.co.uk/) | UK | Cabinets, counters, multidecks, coldrooms, bakery | 🟢 | `/info-centre` — one hub fanning out to Downloads, BIM/CAD, News, Events, Videos, Case studies, Guides, FAQs, Leasing, Delivery. The best "everything that is not a product" page in the sample |
| 3 | [turboairinc.com](https://www.turboairinc.com/) | US | Reach-ins, undercounters, worktops, merchandisers, display cases | 🟢 | **Two taxonomies over one catalogue** — browse by type *or* by series (PRO / Super Deluxe / M3 / J / E Line) — plus a persistent `/compare` basket |
| 4 | [everestref.com](https://everestref.com/) | US | Reach-ins, undercounters, prep tables, merchandisers, lab | 🟢 | `/downloads` split four ways (marketing · owner's manuals · service manuals · presentations) and `/support` split by **department**, not by topic |
| 5 | [continentalrefrigerator.com](https://continentalrefrigerator.com/) | US | Reach-ins, worktops, prep, bar | 🟡 | A **configurator with no price** — "configure endless combinations of model modifications", ending in a quote request |
| 6 | [tefcold.com](https://www.tefcold.com/) | Denmark | Coolers, freezers, counters, wine | 🟢 | Answers "do you sell domestic fridges?" **in the homepage FAQ**: *"We only sell commercial refrigeration solutions for business."* Plus a dealer-only MediaBank for images and manuals |
| 7 | [infrico.com](https://infrico.com/en/) | Spain | Bottle coolers, undercounters, reach-ins, display, dry aging | 🟢 | Opens with "We're ready to offer you some advice. **What do you need?**" over a product-type chooser — advice framing instead of a slogan |
| 8 | [gram-professional.com](https://gram-professional.com/) | Denmark | Professional refrigerators and freezers only | 🟢 | The narrowest range in the sample and the clearest site for it. One sentence of positioning, then the range |
| 9 | [skope.com](https://skope.com/) | New Zealand | Fridges, freezers, food displays | 🟢 | `/skope-offering`: the product range is one of four pillars — the others are **after-sales support, fleet management and finance**. The strongest answer to "why buy from the manufacturer" |
| 10 | [victoryrefrigeration.com](https://www.victoryrefrigeration.com/) | US | Reach-ins, undercounters, prep, speciality | 🟢 | The homepage is literally "Shop by Market Segment" — industry-first, with no product chooser at all |
| 11 | [norlake.com](https://norlake.com/) · [master-bilt.com](https://www.master-bilt.com/) | US | Walk-ins, refrigeration systems, ice-cream cabinets | 🟢 | A **savings calculator** (`/calculator/`) that sizes a walk-in and prints the energy saving, with every assumption listed underneath. Two sibling brands sharing one IA |
| 12 | [howardmccray.com](https://howardmccray.com) | US | Display cases, open-air, reach-ins | 🟢 | Market segments as the primary grid, and a `Resources` block of exactly three things: Product Guide · Spec Sheets · Manuals |

### B. Retail and supermarket refrigeration

| # | Site | Country | | The one thing worth copying |
|---|---|---|:-:|---|
| 13 | [hussmann.com](https://www.hussmann.com/) | US | 🟢 | `/retail-solutions/*` — a landing page per **retail format** (supermarket, c-store, drug store, dollar store, mass merch, foodservice) — and a `/services/*` tree that sells installation, maintenance, store design and *financing* |
| 14 | [hillphoenix.com](https://www.hillphoenix.com/) | US | 🟢 | Refrigerant policy as content: `/co2-refrigeration`, `/epa-aim-proposed-rule`, refrigerant-regulation explainers. They turned compliance anxiety into landing pages |
| 15 | [zero-zone.com](https://www.zero-zone.com/) | US | 🟢 | Downloads split into **Helpful** (brochures, product sheets, colour chart) and **Technical** (spec sheets, manuals, CAD). Proof in numbers: 1,000 quality checks per unit, 99% on-time, 7-week lead time |
| 16 | [arneg.com](https://www.arneg.com/en/) | Italy | 🟢 | Aftermarket written as four verbs: *order spare parts · control your consumption · choose your assistance package · renew your store*. Case studies headlined by **city**, not by client |
| 17 | [aht.at](https://www.aht.at/) | Austria | 🟢 | An energy page that is a **measured comparison** — 56.9% saving against remote freezers, sourced to the EU EPREL database, over a stated 15 m installation |
| 18 | [costan.com](https://www.costan.com/en) (Epta group) | Italy | 🟢 | An **energy-labelling FAQ on the homepage** — which documents must accompany a cabinet, where the label must be displayed, what the QR code resolves to. Compliance anxiety answered before it is asked. Also a group that keeps each brand on its own single-purpose site instead of one divisional site |

### C. India

| # | Site | | What it proves |
|---|---|:-:|---|
| 19 | [westernequipments.com](https://westernequipments.com/) | 🟢 | Audited in Rev 1.0. Hoshizaki India; the direct comparable |
| 20 | [elanpro.net](https://elanpro.net/) | 🟡 | `/about-us/` is **one page with six anchors** (overview · mission · journey · strength · value proposition · management) — the earlier audit's recommendation, already standard practice in this market. Products are categorised by **application** (bar · retail · supermarket · pharma · professional kitchen), and `/service/` is a complaint form, not prose. Field list in §3.8 |
| 21 | [climatrolcorp.com](https://climatrolcorp.com/) | 🟢 | The India framing done well: *"Engineered for Indian conditions"* above the headline, then three proof chips — ISO 9001:2015 · Pan-India sales & service · In-house design & manufacturing — then industries (Government · Manufacturing · Healthcare · Education · Defence · Hospitality), then 40+ client logos. Every CTA is "Talk to an expert" or "Get a quote" |
| 22 | [icemakeindia.com](https://www.icemakeindia.com/) | 🟢 | `/network/` is **a table of twenty city names** plus a dealership enquiry form. Nothing else — and it still answers the question. Settles the "is a plain city list enough" debate (§3.12) |
| 23 | [shop.rockwell.co.in](https://www.shop.rockwell.co.in/) | 🟢 | The one Indian pure play that **publishes prices** and sells online (Shopify), with `/warranty-activation`, `/pages/store-locator`, `/pages/partner-with-us` and `/pages/e-waste`. Proof that the no-price convention is a choice, not a law |
| 24 | [hoshizaki.com](https://www.hoshizaki.com/en/solutions-innovation/products/refrigeration) · [hoshizaki-europe.com](https://hoshizaki-europe.com/) | 🟢 | Source of our six-family taxonomy. The Europe arm shows how one catalogue gets re-cut per region |

### D. Premium residential and undercounter — refrigeration-only by definition

| # | Site | | The one thing worth copying |
|---|---|:-:|---|
| 25 | [u-line.com](https://www.u-line.com/) | 🟡 | Collections by **installation context** rather than size: Outdoor · Marine · ADA · **230 V Global Models**. Separate `/dealers` and `/servicers` locators, plus `/documentation`, `/request-product-literature`, `/request-product-service`, `/registration`, `/safetyrecall` |
| 26 | [true-caliber.com](https://true-caliber.com/) | 🟢 | True's residential arm — `true-residential.com` now redirects here. "Build your True" finish configurator, no price |
| 27 | [marvelrefrigeration.com](https://www.marvelrefrigeration.com/) | 🟡 | **Warranty spelled out on the homepage** — "2 years parts and labour, plus 6 years sealed-system parts" — as a selling feature, beside the refrigerant (R600a) |
| 28 | [perlick.com](https://www.perlick.com/) | 🟡 | Splits the whole site at the first click into *Discover Commercial* / *Discover Residential* — the cleanest fix for two audiences over one catalogue |

### E. Medical and scientific cold chain

| # | Site | | The one thing worth copying |
|---|---|:-:|---|
| 29 | [bmedicalsystems.com](https://www.bmedicalsystems.com/en/) | 🟢 | URLs read `/solutions/<application>/<product-type>/` — the application owns the product, not the reverse. `/support/` carries exactly four things: brochures · user manuals · FAQ · white papers |
| 30 | [gram-bioline.com](https://gram-bioline.com/) · [haiermedical.com](https://www.haiermedical.com/) | 🟢 | Compliance and validation documents treated as primary content, because in this segment the document *is* the product |

### Looks comparable, is not — do not use as a model

| Site | Why not |
|---|---|
| celfrost.com | Middleby Celfrost. Ovens, fryers, grills, mixers; refrigeration is one shelf of a 25-brand catalogue |
| migali.com | Refrigeration **and** commercial cooking |
| subzero-wolf.com | Paired with Wolf (cooking); `/subzero` on its own 404s |
| katom.com · webstaurantstore.com · cooksdirect.com | Dealers, not manufacturers. Useful only for filter and price-display patterns |
| aligroup.com · bluestarindia.com | Conglomerates. Divisional IA — the thing we are avoiding |

---

## 3. Twelve patterns the first audit did not capture

Each carries a verdict for this repo.

**3.1 — Tag every family by the job it does.** Foster prefixes each range with
`STORAGE`, `DISPLAY`, `PROCESS`, `PREP` or `FRONT OF HOUSE`. A buyer who needs to
*display* cake does not know whether that is a "pastry cabinet" or a "confectionery
showcase"; they do know it is display.
**Steal.** One extra string per family in `product.specs.job`, rendered as a chip on
the hub and as a facet. Our six map to: Reach-In → storage · Undercounter → storage +
prep · Glass Door → display · Display Cases → display · Deep Freezer → storage ·
Walk-In → storage.

**3.2 — Two taxonomies, one catalogue.** Turbo Air exposes the same SKUs by type
(`/product-category/reach-ins/`) and by series (`/product-by-series/m3-series/`).
Professional buyers shop by series once they have standardised on one.
**Adapt later.** `product.series` already exists and already renders on the detail
page. Add `/products/series/[series]` when two or more series have real model counts,
not before.

**3.3 — A compare basket, not just a comparison table.** The first audit recommended
a per-category comparison table and noted that nobody does it well. Turbo Air in fact
has `/compare` — a cross-category basket you add models to from any card.
**Steal.** See §4.10. Highest-value new route in this document, and cheap: the data is
already in `product_variant`.

**3.4 — A configurator is allowed, as long as it has no price.** Continental's
configurator and True Caliber's "Build your True" both end at a quote. The earlier
"no build & price" rule was about *price*, not about configuration.
**Adapt.** A finish / hinge / shelf picker that pre-fills the enquiry is in scope;
anything that computes a rupee total is not. Fits `lead_item.note`.

**3.5 — Calculators are the one lead magnet this industry actually uses.** Nor-Lake
sizes a walk-in and prints the kWh saving; Williams has a coldroom carbon calculator.
Both list every assumption underneath — ambient, runtime, tariff, panel thickness —
which is what makes them credible rather than promotional.
**Steal, phase 6.** Ours: a running-cost estimator from `power_w` × hours × ₹/kWh, and
a cold-room load sizer. State the assumptions, including 43 °C ambient — which
`ambient_max_c` already defaults to on every variant.

**3.6 — Downloads is a taxonomy, not a list.** Williams: price lists · technical data
sheets · brochures · CAD drawings · case studies · operating manuals · policies ·
certificates · delivery information, with "Most Popular Downloads" surfaced first.
Zero Zone splits *Helpful* from *Technical*. Everest splits by audience: marketing
material, owner's manuals, service manuals, presentations.
**Steal.** `DOCUMENT_KIND` in [`src/db/schema/catalog.ts`](../../src/db/schema/catalog.ts)
already covers seven (`spec_sheet`, `manual`, `brochure`, `catalogue`, `certificate`,
`cad`, `warranty`). Add `case_study` with §4.8; add `price_list` only if pricing is
ever published.

**3.7 — Delivery and site survey are content, not the courier's problem.** Williams
publishes a delivery zone map, live tracking, a **site survey guide** and the terms
for safe disposal of the old appliance; Foster has `/aftercare/delivery`.
**Steal the site survey, skip the tracking.** A cabinet that will not fit through the
kitchen door is the most expensive mistake in this category. One "before your cabinet
arrives" block — door width, floor level, clearances, power point, drainage, who
unpacks it. Tracking needs a logistics integration we do not have.

**3.8 — The Indian service page is a form.** Elanpro's `/service/` is a complaint
registration form, and its field list is worth copying verbatim because it is what an
Indian service desk actually needs: full name · email · phone · address · city ·
state · **model number** · **serial number** · date of purchase · **warranty status**
· supporting-documents upload · issue description · purchased from (online store /
retail outlet / other) · retailer name · invoice number · **preferred contact method
(email / phone call / WhatsApp)** · consent checkbox.
**Steal, trimmed.** `lead` already accepts `type: 'support'`. Model code, serial
number, invoice number and preferred contact go in `lead.source` until a dedicated
table is justified. The upload needs the `media` module — an empty directory today —
so ship v1 without it and add it alongside §4.5.

**3.9 — FAQ by department beats FAQ by topic.** Everest groups its FAQ into Company ·
Tech & Warranty · Parts · Shipping · Accounting, and every answer routes to a person
or a form. Tefcold and Zero Zone both put a short FAQ on the **homepage**, answering
the two questions that disqualify a visitor fastest ("are these domestic?", "what does
freight cost?").
**Steal both.** Group by who answers. Put three on the home page.

**3.10 — Aftermarket as verbs.** Arneg: *order spare parts · control your consumption
· choose your assistance package · renew your store.* Four verbs, four revenue lines,
no prose.
**Steal.** Ours: *book a service visit · order genuine spares · take an AMC · replace
an ageing cabinet.* These become the four cards at the top of `/support`.

**3.11 — There is a dealer-only layer, and it is where the price list lives.**
Foster's `/customer-care/dealer-support/` carries the UK price list, the BIM library,
co-branding assets and dealer training. Tefcold gates its MediaBank. Elanpro gates
downloads behind a role picker (Dealer / Influencer / Employee).
**Adapt, phase 6.** `app_user` already has roles (`admin`, `editor`, `sales`) and
Auth.js magic-link is the planned mechanism; add a `dealer` role and a `/partners`
area once the first ten dealers exist. Do **not** gate spec sheets — the earlier audit
is right that it costs leads.

**3.12 — A city list is a locator.** Ice Make's entire network page is twenty city
names in a table plus a dealership form, and it answers the only question that
matters. U-Line's richer version filters by product type, country and radius, with
"use your current location".
**Steal the list now, the map later.** `installation.geo` is already a PostGIS
geography column with a GiST index, so the map has somewhere to come from the day
there are pins.

---

## 4. Build specs for the routes that do not exist

### Where the repo actually stands

**Updated 2026-10-10 — phases 1 to 4 are built.** Live routes: `/`,
[`/products`](../../src/app/products/page.tsx),
[`/products/[slug]`](../../src/app/products/[slug]/page.tsx),
[`/industries`](../../src/app/industries/page.tsx),
[`/about`](../../src/app/about/page.tsx),
[`/support`](../../src/app/support/page.tsx),
[`/contact`](../../src/app/contact/page.tsx),
[`/downloads`](../../src/app/downloads/page.tsx),
[`/compare`](../../src/app/compare/page.tsx),
[`/privacy`](../../src/app/privacy/page.tsx),
[`/terms`](../../src/app/terms/page.tsx), plus `sitemap.ts`, `robots.ts` and
`not-found.tsx`. The nav is five real routes and every company fact comes from
[`src/content/site.ts`](../../src/content/site.ts).

The product page is built as **option C, the model picker** (§4.0): the model
list leads, and the specification, the drawing, the spec sheet and the quote
all follow the selection — the enquiry carries `lead_item.variant_id` and a
quantity, so an RFQ is "two HR-128MA-S", not "someone wants a reach-in".

Still outstanding: catalogue facets (§4.9), `/network`, `/installations`,
`/technology`, `/news`, `/careers` (phase 5), and the documents themselves —
`src/modules/{content,media,search}` are still empty directories, so
`/downloads` and the product pages show "upload pending" rows until R2 is
wired.

What was true when this document was written, for the record: only `/`,
`/products` and `/products/[slug]` existed; the header linked to
`/#technology`, `/#industries`, `/#support` and `/#company`, and the last two
resolved into the **footer** rather than into pages.

### 4.0 The product page layout: three were drawn, C was chosen

Three layouts were mocked at desktop and phone width before building:

| | Layout | Verdict |
|---|---|---|
| **A** | **Spec-first** — image left, at-a-glance right, spec table below. What the page already was. | Safe, and it answers "what is this" — a question the visitor stopped asking before they arrived |
| **B** | **Sticky quote rail** — thumbnail gallery, tabbed Specification / Construction / Downloads / Warranty, quote rail that stays on screen | Good for one SKU per page. Ours are families, so the tabs hide the comparison the buyer came for |
| **C** | **Model picker** — the model list leads; specification, drawing, spec sheet and quote follow the selection | **Built.** The question on a family page is "which of these", and this is the only layout that answers it in one screen |

C also closes the loop that matters commercially: because the selection sits
in the same React tree as the enquiry form, the RFQ carries
`lead_item.variant_id` and a quantity. A and B would both have produced a
product-level lead the sales desk has to telephone about.

Mechanics worth knowing before changing it
([`model-picker.tsx`](../../src/components/model-picker.tsx)): the selection is
in component state, **not** in the URL — `/compare` puts it in the URL because
a comparison is something you send someone, while reading `searchParams` on a
product page would make the route dynamic and put a database read behind every
visitor. The sections below the picker (full specification table, warranty,
industries, related) are passed in as `children` from the server component, so
they are still server-rendered and a crawler sees every model code. At phone
width the model list becomes a scrollable chip row and the quote rail becomes
a fixed bottom bar; same markup, CSS only.

### One correction to the earlier plan

`SITE-SECTIONS-REPORT.md` §3 asks for six category templates. In this schema that
work is already done: [`scripts/seed.ts`](../../scripts/seed.ts) creates one
`category` and one `product` per family with identical slugs, so `/products/[slug]`
**is** the category page — it carries the family copy, the sub-type chips and the
model table. Six more templates would duplicate it. What is actually missing from the
catalogue is **facets, sub-type anchors and compare** (§4.9, §4.10). Treat the six
category pages as done.

---

### 4.1 `/industries` — Industries & Applications

**Inspired by** Victory (market segments as the entire homepage) · Hussmann
`/retail-solutions/*` (a page per retail format) · B Medical (`/solutions/<app>/`) ·
Climatrol (six industries, Indian institutional mix) · Elanpro (products categorised
by application rather than type).

**Sections**
1. Intro, one paragraph: six kinds of business, and the cold problem each has.
2. Six anchored blocks, one per `industry` row in `sort_order` — photo · the cooling problem in two or three sentences · 3–4 product links via `product_industry` · the recommended temperature band · one installation reference once §4.8 exists.
3. Per-block CTA with the industry pre-filled into the enquiry.
4. Cross-link band to `/products` and `/support`.

**Data** `industry` and `product_industry` are seeded with all six and already
joined. Copy belongs in `industry.summary`; the temperature band and photo key go in
MDX per HLD-FREE-TIER §5.3, or a new `industry.specs` JSONB.

**Day one** Six blocks of real copy, anchored `#restaurants-qsr` …
`#icecream-dairy-beverage` to match the seeded slugs — the home page's industry rail
will link into them.

**Do not** split into six routes yet. Victory and Hussmann can carry a page per
segment because they have installations to put on it. Revisit when `installation` has
rows.

---

### 4.2 `/about` — one page, anchored

**Inspired by** Elanpro's six-anchor about page · Climatrol's three proof chips ·
Zero Zone's numbers (1,000 quality checks, 99% on-time, 7-week lead time) ·
Howard-McCray's dated history narrative · Ice Make's `/infrastructure` and
`/prestigious_clients`.

**Sections** `#overview` · `#numbers` (five, each a number and not an adjective) ·
`#manufacturing` (plant photographs, capacity, in-house processes) ·
`#certifications` (ISO · BIS/ISI · CE · energy rating · refrigerant compliance —
logos plus one line each; in Indian tenders this is the deciding section) ·
`#sustainability` (R290/R600a, energy, e-waste) · `#partnership` (the Hoshizaki
relationship, if it is ours to claim) · links out to `/careers` and `/contact`.

**Day one** Overview, numbers, certifications. Manufacturing and sustainability can
be two paragraphs until there are plant photographs.

**Do not** create separate R&D, sustainability or factory pages. Ice Make has all
three plus investor relations because it is listed — a disclosure obligation, not an
IA decision.

---

### 4.3 `/support` — Service & Support, one page

**Inspired by** Arneg's four aftermarket verbs · Hussmann `/services/maintenance-repair`
(trained technicians, service agreements, parts, then cross-links) · Everest's
department-grouped FAQ · Foster `/customer-care/aftercare/{delivery,report-a-fault,warranty}`
· Williams' site-survey and safe-disposal terms · Elanpro's complaint form.

**Sections**
1. **Helpline first** — phone, hours, service email, WhatsApp click-to-chat, above everything else, as True and Foster both do.
2. **Four cards** (§3.10): book a service visit · order genuine spares · take an AMC · replace an ageing cabinet.
3. **Service request form** — the Elanpro field set, trimmed: name · phone · email · city · model code · serial number · purchase date · issue · preferred contact method. Posts to `/api/leads` with `type: 'support'`.
4. **AMC & preventive maintenance** — the plans, and what each covers, in one table. Hussmann sells this as "the most effective way of ensuring your equipment is properly serviced"; copy the logic, not the words.
5. **Warranty** — terms by product line in one table, what voids it, how to claim. Marvel puts the full terms on its homepage, because it closes deals; do not bury it.
6. **Installation, commissioning and site survey** (§3.7) — door width, floor level, clearances, power point, drainage, who unpacks.
7. **Service network** — the city list, until it earns its own route (§4.7).
8. **FAQ grouped by who answers it** — Sales · Service & warranty · Spares · Delivery · Accounts. Ten to fifteen real questions.
9. Link to `/downloads` for manuals.

**Data** `lead` with `type: 'support'`; `lead.source` carries model code and serial
number until a `support_request` table is justified.

**Do not** build the twenty-five-URL support tree. The earlier audit's reasoning
holds, and this round reinforces it: Hussmann's six warranty sub-pages exist to serve
a claims system with 600 technicians behind it.

---

### 4.4 `/contact` — Contact & Enquiry

**Inspired by** Foster's contact page — phone first, then "got a question? read our
FAQs", then "report a fault", then "vacancies"; it routes three audiences away before
they mis-use the form · Ice Make (network table and dealership form on one page) ·
Climatrol's "Talk to an expert".

**Sections**
1. Enquiry form — the nine fields from `SITE-SECTIONS-REPORT.md` §8. [`EnquiryForm`](../../src/components/enquiry-form.tsx) already exists and already takes `modelContext`.
2. Routing links **above** the form: service → `/support`, documents → `/downloads`, jobs → `/careers`, dealership → the anchor below.
3. Direct channels — sales phone, service phone, email, WhatsApp — with the response-time commitment stated.
4. Offices — registered office and plant, map, **GSTIN**.
5. `#dealership` — become a dealer or distributor; short form, `lead.type: 'contact'` with a source tag.
6. Business hours.

**Day one** Form, phone, WhatsApp, one address, GSTIN.

---

### 4.5 `/downloads` — the resource centre

**Inspired by** Williams `/downloads` (nine categories plus "Most Popular") ·
Zero Zone (Helpful vs Technical) · Everest (four audience-based groups) · B Medical
(brochures · manuals · FAQ · white papers) · Howard-McCray (Product Guide · Spec
Sheets · Manuals, and nothing else).

**Sections**
1. Hero download: the full product catalogue PDF.
2. Filter by kind (the `DOCUMENT_KIND` enum) and by family — two selects, server-rendered, no client state.
3. Grouped lists. **Technical**: spec sheets · manuals · CAD/Revit. **Commercial**: brochures · catalogue · certificates · warranty statements.
4. Most-downloaded strip, once there is traffic data.
5. "Can't find a document?" → `/contact` with the type pre-set.

**Data** The `document` table, indexed on both `product_id` and `category_id`, with
`extracted_text` present precisely so this page is searchable without a crawler.
Documents attach **per range, not per SKU** (HLD-FREE-TIER §2.3).

**Blocked on** the `media` module and R2 wiring — `src/modules/media` is empty and
[`src/lib/adapters/storage.ts`](../../src/lib/adapters/storage.ts) is the seam. The
page itself is a filtered list over one table, which is why the earlier audit called
it the best effort-to-value ratio on the site. Still true.

**Do not** gate spec sheets. The dealer-only layer (§3.11) is a different, later
thing.

---

### 4.6 `/privacy` and `/terms`

**Inspired by** Rockwell's `/pages/e-waste` · Hillphoenix's refrigerant-regulation
pages · the specification-change clause that every one of the twelve foodservice
sites carries.

**Contents** Data collected, form-data use, retention, DPDP contact; terms of use,
**product image disclaimer**, **"specifications subject to change without notice"**,
IP notice, **e-waste handling note** (mandatory in practice for an Indian appliance
seller), and safe disposal of the replaced appliance.

Two thin pages, footer-linked. `lead.consent_at` is `NOT NULL` by design, so the
privacy page is what that column points at — it cannot stay a `#` link for long.

---

### 4.7 `/network` — service cities and dealers

**Inspired by** Ice Make `/network/` (twenty cities plus a dealership form) ·
U-Line `/dealers` (product type, country, radius, current location) · Nor-Lake
`/contact-us/service-locator/` · Rockwell `/pages/store-locator`.

**Phase 1** A city list inside `/support`. Nothing more.
**Phase 5** Its own route once there are dealers: state → city → name, phone, lines
carried, plus "no dealer near you? contact us direct", plus the dealership form.
`installation.geo` and its GiST index are already in place for the map.

**Do not** ship an empty map. An empty locator reads worse than no locator.

---

### 4.8 `/installations` — case studies

**Inspired by** Arneg (case studies headlined by city, on the homepage) · Williams
(case studies filed as downloads: PwC, Sheffield Teaching Hospital, Mandarin Oriental
Mayfair) · Climatrol's 40+ client logos · Ice Make `/prestigious_clients`.

Note what Williams does: a case study is a **downloadable PDF** sitting next to the
spec sheets. That is cheaper than a page per project, and it is what a consultant
forwards internally.

**Sections** A grid filterable by industry and city; per project — client (with
permission), city, industry, equipment supplied, photographs, one-line outcome.

**Data** The `installation` table exists: slug, client, city, `industry_id`, geo,
`commissioned_on`, status. Nothing to migrate.

**Start now, ship later.** Photograph every commissioning from today. The page is
worthless without photographs and cannot be backfilled.

---

### 4.9 Catalogue facets and sub-type anchors on `/products`

**Inspired by** Foster `/product-finder` · Turbo Air's dual taxonomy · True's
`/advanced-search`, the only faceted search in the first audit.

The facet set is already specified in `SITE-SECTIONS-REPORT.md` §6 and the columns
back it: `capacity_l`, `temp_min_c`/`temp_max_c`, `refrigerant`, `power_w`,
`dims_mm`, `energy_class` on `product_variant`; sub-types in `product.specs.subTypes`,
already rendered as chips on the detail page; `product_specs_gin` indexes the JSONB
for exactly this.

**Build** Query-param facets on `/products` (`?job=&type=&doors=&temp=&litres=`),
server-rendered so every combination is crawlable, plus the `job` tag from §3.1 and
sub-type anchors on each family page.

---

### 4.10 `/compare` — new, and the best value on this list

**Inspired by** Turbo Air `/compare`.

A basket. "Add to compare" on every model row and card;
`/compare?m=HR-78MA-S,HR-128MA-S` renders one table — a row per spec, a column per
model, differences highlighted, and `Request a quote for both` at the bottom writing
two `lead_item` rows.

Everything it needs is in `product_variant` today and the state lives in the URL: no
client store, no schema change. It is the one page here that no competitor in either
sample does well, and the first audit already named the comparison table as the
easiest place to beat them.

---

### 4.11 `/technology` — Why Us

**Inspired by** AHT's measured 56.9% energy comparison sourced to EPREL ·
Hillphoenix's refrigerant-regulation pages · Zero Zone's "1,000 quality checks" ·
Foster's natural-refrigerant positioning.

Three to five differentiators, each with a number and a source: temperature
uniformity and airflow · 43 °C ambient performance (the `ambient_max_c` column *is*
the claim) · R290/R600a and measured consumption · stainless grade · serviceability.

The home page's `#technology` section is where this expands from. **Only build it
when the test data exists** — AHT's page works because the numbers come from a public
database.

One more block belongs here, borrowed from Costan: **which documents accompany a
cabinet** — energy label and class, CE/BIS declaration, test report — and what the
label on the unit means. `product_variant.energy_class` is already a column; this is
the page that explains it.

---

### 4.12 `/news` and `/careers`

`news_post`, `job` and `job_application` already exist, including a CV storage key and
a 12-month DPDP retention rule.

**News** One combined feed. Williams categorises by `product-launch` · `corporate` ·
`bakery` · `in-the-community`, which `news_post.tags` (GIN-indexed) handles. Do not
start unless you can publish monthly for a year.

**Careers** One page: why work here, two photographs, openings from `job`, an
application form with CV upload, HR email. Foster links to vacancies from its contact
page — copy that link. A page that says "write to careers@" is an acceptable v1.

---

### 4.13 Infrastructure that is missing and is not a page

| Missing | Why it matters |
|---|---|
| `src/app/sitemap.ts` | 300+ model URLs and a faceted catalogue. Two of the thirty sites also publish an HTML sitemap page |
| `src/app/robots.ts` | Needs to disallow facet permutations while allowing the canonical family pages |
| `src/app/not-found.tsx` | Model codes churn. A 404 offering the family page and the compare tool recovers the visit |
| JSON-LD | `Product` + `Offer` with `availability` and no `price` is valid, plus `BreadcrumbList` on the detail page — the crumb is already rendered as plain HTML |
| `modules/search` | Empty. `search_tsv` is a generated column with a GIN index waiting for it |

---

## 5. India-specific confirmations from this round

The first audit inferred these. The Indian pure plays confirm them.

1. **WhatsApp is a channel with equal billing.** Elanpro offers it as a *preferred contact method* form field, not just a floating button.
2. **Serial number, invoice number and warranty status** are the fields an Indian service desk opens with. Design the support form around them.
3. **"Engineered for Indian conditions"** is the positioning line, and Climatrol puts it above the headline. Our version is already in the schema: `ambient_max_c` defaulting to 43.
4. **Three proof chips above the fold** — certification, pan-India service, in-house manufacturing. Climatrol's exact set, and the right one.
5. **A city list is the credible form of "pan-India service".** Twenty names in a table (Ice Make) beats a sentence.
6. **E-waste gets its own page**, as Rockwell and Blue Star both do.
7. **The dealership enquiry belongs on the network page**, where someone reading the city list notices their city is missing.
8. **Prices are optional, not forbidden.** Rockwell publishes them and sells online. The pricing seam — `product_variant.mrp_inr`, `NULL` today, already rendered through `price-slot` — is the right hedge.

---

## 6. Still leave out

Beyond the earlier audit's list:

| Leave out | Found on | Why not |
|---|---|---|
| Investor relations, shareholding, annual returns | Ice Make, Elanpro | Listed-company and statutory disclosure. Not a website decision |
| Webshop with checkout | Tefcold, Rockwell | A storefront with inventory, freight rules and payments. The enquiry is the conversion event |
| Order status tracking | Turbo Air, Everest, Williams | Needs an ERP integration and an installed base |
| Warranty claims portal with service-provider forms | Hussmann, Everest | Six sub-pages serving a claims system. One service form covers us |
| Podcast, magazine, apparel store | Infrico, Perlick | Brand programmes for companies with a brand to extend |
| 360° virtual factory tour | Elanpro | Revisit when the plant photography exists; a nice-to-have inside `/about` |
| Dealer price list, MediaBank, co-branding kit | Foster, Tefcold | Phase 6, behind the `dealer` role (§3.11) |
| Separate per-industry routes | Victory, Hussmann, B Medical | One anchored page until `installation` has rows |

---

## 7. Amended build order

| Phase | Build | Rationale |
|---|---|---|
| 1 | `/contact` · `/support` · `/privacy` · `/terms` | Every CTA on the live site points at `#enquire` or a dead `#`. `lead.consent_at` needs a privacy page to point at |
| 2 | `/downloads` (with the `media` module) · `/compare` | The two pages that close B2B enquiries. Compare needs no new data |
| 3 | `/industries` · `/about` | Industry data is already seeded; About is the tender de-risker |
| 4 | Facets and sub-type anchors on `/products` · `sitemap.ts` · `robots.ts` · `not-found.tsx` · JSON-LD | Makes the catalogue findable — worth more than any new page once the catalogue is real |
| 5 | `/network` · `/installations` · `/technology` · `/news` · `/careers` | Each on the day its content exists: dealers listed, projects photographed, test data measured, a publishing commitment made, a role open |
| 6 | Calculators · dealer portal · series taxonomy | Only with real numbers, real dealers, real series |

**Route manifest after phase 5**

```
/                      built
/products              built  — add facets (§4.9)
/products/[slug]       built  — is the category page; add sub-type anchors + compare buttons
/compare               §4.10  new
/industries            §4.1   (six anchors)
/about                 §4.2   (six anchors)
/support               §4.3   (#helpline #service-request #amc #warranty #install #network #faq)
/contact               §4.4   (#dealership)
/downloads             §4.5
/network               §4.7   phase 5
/installations         §4.8   phase 5
/technology            §4.11  phase 5
/news                  §4.12  phase 5
/careers               §4.12  phase 5
/privacy  /terms       §4.6
sitemap.ts  robots.ts  not-found.tsx    §4.13
```

Fourteen routes, three of which exist. Every one of them has content on day one, or
it does not ship — the rule from the first audit, unchanged.
