# High-Level Design — KALT / SS Commercial Refrigeration Platform

| | |
|---|---|
| **Status** | Rev 1.1 — design reviewed against the deployed code |
| **Date** | 2026-10-07, revised 2026-10-12 after the first production deployment |
| **Implementation** | Phase 1 is partly built and **live** at https://ss-refrigeration.vercel.app. This document describes the full design; [HLD-FREE-TIER.md §0a](HLD-FREE-TIER.md) lists what exists today, and [`docs/ops/REMEDIATION-PLAN.md`](../ops/REMEDIATION-PLAN.md) lists the open faults. Statements below that contradict the running code are marked **not built**. |
| **Scope** | Public brand site, product catalogue, technical resource centre, lead engine, careers |
| **Reference** | Feature inventory taken from [williamsrefrigeration.co.in](https://www.williamsrefrigeration.co.in/) |
| **Diagram** | *None.* The target-architecture canvas was deleted on 2026-10-12: it drew Kafka, Debezium, OpenSearch, PgBouncer and multi-AZ failover, and §4 of this document argues that nothing at this traffic volume justifies them. The prose below keeps the reasoning; a picture of it invited the wrong build. Current canvas: [`ss-refrigeration-current.svg`](ss-refrigeration-current.svg) (as-built). Phase 1 roadmap: [`ss-refrigeration-free-tier.svg`](ss-refrigeration-free-tier.svg). |
| **Decision record** | ADR-0001 (database), §7 of this document |

---

## 1. Context and the honest framing

Today this repository is a single static `index.html` with local WebP assets. That is the right
artefact for a demo and the wrong one for a business that needs to publish ~350 model codes,
ship datasheets, run trade-show campaigns and capture enquiries.

The temptation in a document like this is to design a system that survives a million requests per
second. **That is not the problem here.** A B2B refrigeration brand in India sees on the order of
150–300k pageviews a month. The real failure modes are:

1. **Losing organic search traffic during a rebuild.** The existing URLs *are* the asset.
2. **Dropping an enquiry.** One lost RFQ is worth more than a year of hosting.
3. **Content going stale because publishing requires a developer.**
4. **Page weight.** This is a photo-heavy catalogue; images decide both LCP and the cloud bill.

So the design principle throughout is: **cheap and boring now, with the seams pre-cut where the
next 10× actually lands.** Every component below is justified against those four failure modes,
and §8 states the metric that triggers each scaling step rather than a calendar date.

---

## 2. Functional scope

Derived from the reference site's information architecture, plus the two capabilities it lacks
that a modern buyer expects (faceted spec search, and a quote cart).

| Surface | What it does | Why it shapes the design |
|---|---|---|
| Marketing pages | Home, about, quality/ISO, sustainability, awards, contact | Pure static. SSG, zero origin cost. |
| Product catalogue | 3 ranges → ~25 collections → ~350 model codes, each with standard / optional / key / common feature blocks, spec tables, galleries | The core relational graph. Drives the schema. |
| Resource centre | Catalogues, datasheets, manuals, certificates as PDF, filterable by range | Object storage + signed URLs + extracted text for search. |
| Industries | Gelato, patisserie, bakery, QSR, bar, supermarket, cold room, Indian sweets | Many-to-many with products; its own landing pages. |
| Installations | Case studies with client, city, industry, gallery | Geo column → PostGIS map. |
| News & events | Expo participation, launches, journal articles | Time-ordered, BRIN-indexed. |
| Careers | Job postings by department/location + applications with CV upload | File intake → AV scan → private storage. |
| Lead capture | Contact, callback, technical support, **quote cart (RFQ with line items)** | The only revenue-carrying write. Gets the strictest SLO. |
| Admin | Publish, preview, revision history, role-based access, audit trail | Revisions + append-only audit log. |

**Explicitly out of scope for v1:** e-commerce checkout, dealer pricing, IoT cabinet telemetry,
service ticketing. Each is anticipated in the schema and the phase plan, none is built now.

---

## 3. Non-functional targets

| Dimension | Target | Why this number |
|---|---|---|
| Availability — site | 99.9 % | CDN-fronted static content; the budget is ~43 min/month. |
| Availability — `POST /v1/leads` | 99.95 % | Tighter, because it is the only write that carries revenue. |
| TTFB | p75 < 400 ms | Below the threshold where bounce rate measurably climbs. |
| LCP / INP / CLS | p75 < 2.0 s / < 200 ms / < 0.1 | Core Web Vitals is a Google ranking input. This is an **SEO control, not polish** — enforced by Lighthouse CI budgets that fail the build. |
| Internal API | p99 < 300 ms | Leaves headroom inside the TTFB budget. |
| RPO / RTO | 5 min / 30 min | WAL shipping + PITR. Restore drilled quarterly. |
| Lead durability | Zero tolerance | Outbox + DLQ + alert on DLQ depth > 0. |
| Publish freshness | p95 < 30 s click-to-live | Marketing must be able to fix a spec during a trade show. |
| Accessibility | WCAG 2.2 AA, axe clean in CI | Procurement questionnaires ask for it. |

**Error budget policy:** when the 0.1 %/month budget is exhausted, feature work stops and the next
sprint is reliability work. Writing this down is the only thing that makes an SLO real.

---

## 4. Capacity model

Sizing from reality rather than ambition, because the sizing is what justifies the simple topology.

```
Traffic     150–300k pageviews/month        → ~0.1 rps average
            Trade-show / campaign peak      → 20–40 rps for ~2 hours
            CDN offload ≥ 95 %              → origin sees < 2 rps even at peak
            ⇒ one small app instance + one read replica is genuinely sufficient

Writes      30–80 leads/day
            ~10 job applications/day
            ~20 content publishes/week
            ⇒ hundreds of writes per day. A single primary is correct for years.

Storage     350 SKUs × (8 images × 300 KB + 2 PDFs × 3 MB)  ≈ 8 GB in object storage
            PostgreSQL < 2 GB
            ⇒ the entire working set fits in RAM. No sharding, ever, at this scale.

Cost driver Image egress dominates, not compute and not the database.
            AVIF + exact-width srcset + immutable long-cache cuts it ~70 %.
            This is why the image CDN is a required component, not an optimisation.
```

The conclusion to draw from this table is that **the architecture's job is correctness,
freshness and crawlability — not throughput.** Anyone proposing sharding, a service mesh or
multi-region active-active at this volume is designing for a promotion packet, not this business.

---

## 5. Architecture

The diagram is the authoritative view; this section explains the choices behind each layer.

### Layer 2 — Edge
The CDN caches **HTML as well as assets**, with `s-maxage` + `stale-while-revalidate` and
**surrogate-key purge keyed per entity**. Every rendered page declares the entity tags it read
(`product:<id>`, `category:<id>`), so a spec correction on one SKU invalidates exactly that SKU's
pages. Wildcard purging would cold-start the whole catalogue and hand every visitor an origin
round-trip during the exact campaign window you were trying to fix.

The 301 redirect map lives in **edge KV**, not in the app, so a redirect costs no origin hop and
survives an app outage. This is the single most important defence against SEO loss during
migration (§10, risk 1).

### Layer 3 — Web tier (Next.js App Router)
- **SSG** for the marketing surface — built at deploy, pure static.
- **ISR** for catalogue, news and installations — on-demand `revalidateTag()` fired by the publish
  event, so freshness does not depend on a TTL expiring.
  *Corrected 2026-10-12: this line previously read "time-based revalidation plus on-demand". There
  is no time-based revalidation anywhere in the build, and there must not be. Every page sets
  `revalidate = false`. [HLD-FREE-TIER.md §4.1](HLD-FREE-TIER.md) explains why — a timer is a
  background database poll in disguise, and it alone would exceed the Neon compute budget.*
- **SSR / streaming RSC** for faceted listing, search and forms.
- **Route handlers act as a BFF**: one aggregate call per page, and domain services are never
  reachable from the browser.

Server-rendered HTML is non-negotiable: Googlebot, Bingbot and AI crawlers must see the full
product content without executing client-side data fetching.

### Layer 5 — Domain services
Deployed as a **modular monolith** — one repository, one deploy unit, modules behind interfaces.
This is deliberate. At this traffic, microservices buy distributed-tracing complexity and
cross-service transactions in exchange for nothing. The three modules marked `[seam]` in the
diagram — **Search, Media, Notification** — are the extraction candidates, chosen because they are
bursty, independently scalable, and already have clean contracts. They come out in phase 3, when a
trigger metric fires, not before.

### Layer 7 — Async backbone
The **transactional outbox** is the load-bearing pattern. The event row is written in the *same
database transaction* as the business row, so there is no dual-write race and no two-phase commit.
A relay (Debezium CDC, or a simple poller in phase 1) publishes it downstream. Every consumer is
idempotent and at-least-once, with a DLQ and an alarm on DLQ depth.

---

## 6. The two paths that must not break

### 6.1 Lead capture

```
1  POST /v1/leads with Idempotency-Key      (collapses double-clicks and client retries)
2  Edge: Turnstile score + honeypot + time-to-fill check + per-IP Redis token bucket
3  Validate, normalise phone/email, hash the IP            (abuse detection only, never stored raw)
4  ONE Postgres transaction:
       INSERT lead  +  INSERT lead_item[]  +  INSERT outbox('lead.created')
5  Respond 202 with lead_ref                              (user sees success in < 300 ms)
6  Worker drains outbox → email to sales, ack to customer, CRM upsert, WhatsApp ping
7  CRM or mail provider down? The row stays in outbox. Exponential retry, then DLQ + page.
```

**The database commit is the durability boundary, and no third party sits on the user's request
path.** A SaaS outage delays notification; it never loses the lead.

> **Not built, and currently failing — step 2.** Turnstile has a server verifier
> (`lib/adapters/captcha.ts`) but **no browser widget**, so no request can carry a token. The
> verifier fails closed in production, so **every enquiry is rejected with HTTP 400**. The
> honeypot and the per-IP bucket are built and working. See
> [`docs/ops/REMEDIATION-PLAN.md`](../ops/REMEDIATION-PLAN.md) P1.
>
> Note what this exposes about the claim above. "No third party sits on the user's request path"
> is true of everything *after* the commit, which is where the outbox protects the lead. It was
> never true of step 2, which sits *before* it. A bot-defence gate is a third party on the request
> path by definition, and when it fails closed it loses the lead the outbox was built to save.

Verification is part of the design, not an afterthought: a synthetic lead is submitted end-to-end
every 5 minutes, and an alert fires on *zero* real leads during a business hour. Silent form
failure is invisible and therefore the most expensive bug available here.

> **Not built.** The probe does not exist. It is the control that would have caught the step-2
> failure above before a visitor did, and it is the clearest lesson of the first deployment:
> `next build`, typecheck, lint and 18 headless-browser checks all passed while the only revenue
> path was broken, because every one of them tested rendering and none submitted the form.

### 6.2 Publish

```
1  Editor saves   → content_revision row (draft, full JSONB snapshot); media via signed PUT to S3
2  Publish        → txn: UPDATE product SET status='live', version=version+1
                        + INSERT outbox('catalog.changed')
3  Indexer        → bulk upsert changed documents into the search index (1 s debounce)
4  Purge worker   → CDN surrogate-key purge + revalidateTag('product:<id>')
5  SEO            → sitemap diff regenerated per locale, IndexNow ping to Google and Bing
6  Rollback       → publish the previous revision. No deploy, no DBA, no downtime.
```

Revisions store a **full JSONB snapshot rather than a diff**. At ~20 publishes a week the storage
is free, and "restore exactly what was live on the morning of the expo" becomes a one-row operation.

---

## 7. Data model

### 7.1 Shape

Five bounded contexts in **one PostgreSQL instance**: Catalog, Content, Demand, Careers,
Platform/SEO. One instance — not one per context — because at this scale the operational cost of
multiple databases exceeds any isolation benefit, and cross-context queries (lead → product,
installation → industry) are routine.

### 7.2 Representative DDL

The parts where the modelling decision is non-obvious. Full migrations live with the application.

```sql
-- ─── CATALOG ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE category (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  parent_id   uuid REFERENCES category(id) ON DELETE RESTRICT,
  path        ltree NOT NULL,              -- 'commercial_refrigeration.counters.r290'
  name        text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  seo         jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX category_path_gist ON category USING gist (path);
-- Whole breadcrumb, or an entire subtree, in one indexed query:
--   SELECT * FROM category WHERE path @> 'a.b.c';      -- ancestors (breadcrumb)
--   SELECT * FROM category WHERE path <@ 'a.b';        -- descendants (range landing page)
-- A recursive CTE would work, but ltree makes it an index scan instead of a loop.

CREATE TABLE product (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  category_id   uuid NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
  name          text NOT NULL,
  series        text,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','live','archived')),
  summary       text,
  specs         jsonb NOT NULL DEFAULT '{}',   -- family-specific, schema-validated on write
  search_tsv    tsvector GENERATED ALWAYS AS (
                  setweight(to_tsvector('english', coalesce(name,'')),    'A') ||
                  setweight(to_tsvector('english', coalesce(series,'')),  'B') ||
                  setweight(to_tsvector('english', coalesce(summary,'')), 'C')
                ) STORED,
  version       int NOT NULL DEFAULT 1,
  published_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_specs_gin  ON product USING gin (specs jsonb_path_ops);
CREATE INDEX product_tsv_gin    ON product USING gin (search_tsv);
CREATE INDEX product_live_idx   ON product (category_id, sort_order)
                                 WHERE status = 'live';   -- the only hot read path

-- The SKU. This separation is the single most important decision in the schema.
CREATE TABLE product_variant (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  model_code     text NOT NULL UNIQUE,          -- the real-world identifier
  capacity_l     numeric,
  gn_config      text,                          -- 'GN 1/1', 'GN 1/2', '400x600'
  temp_min_c     numeric,
  temp_max_c     numeric,
  refrigerant    text,                          -- 'R290', 'R134a', 'R404A'
  ambient_max_c  numeric DEFAULT 43,            -- Indian-climate rating
  power_w        int,
  energy_class   text,
  dims_mm        jsonb,                         -- {w,d,h, packed:{...}}
  weight_kg      numeric,
  mrp_inr        numeric,                       -- NULL until pricing goes public
  CONSTRAINT temp_range_valid CHECK (temp_min_c IS NULL OR temp_max_c >= temp_min_c)
);

-- ─── DEMAND ─────────────────────────────────────────────────────────────────
CREATE TABLE lead (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref         text NOT NULL UNIQUE,            -- human-quotable, e.g. 'KLT-2026-00412'
  type        text NOT NULL CHECK (type IN ('contact','rfq','support','callback','demo')),
  name        text NOT NULL,
  email       citext NOT NULL,
  phone       text,
  company     text,
  city        text,
  message     text,
  source      jsonb NOT NULL DEFAULT '{}',     -- utm_*, referrer, landing path
  status      text NOT NULL DEFAULT 'new',
  owner_id    uuid REFERENCES app_user(id),
  crm_ref     text,
  consent_at  timestamptz NOT NULL,            -- DPDP: when and to what they consented
  ip_hash     bytea,                           -- hashed, never raw
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_created_brin ON lead USING brin (created_at);
CREATE INDEX lead_triage_idx   ON lead (status, created_at DESC) WHERE status <> 'closed';

CREATE TABLE lead_item (                        -- the quote cart; an RFQ = 1 lead + N items
  lead_id     uuid NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES product(id),
  variant_id  uuid REFERENCES product_variant(id),
  qty         int NOT NULL DEFAULT 1 CHECK (qty > 0),
  note        text,
  PRIMARY KEY (lead_id, product_id, variant_id)
);

-- ─── THE ASYNC BACKBONE ─────────────────────────────────────────────────────
CREATE TABLE outbox (
  id              bigserial PRIMARY KEY,
  aggregate_type  text NOT NULL,
  aggregate_id    uuid NOT NULL,
  event_type      text NOT NULL,               -- 'lead.created', 'catalog.changed'
  payload         jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  attempts        int NOT NULL DEFAULT 0,
  last_error      text
);
-- The only genuinely hot scan in the system; a partial index keeps it tiny forever.
CREATE INDEX outbox_unpublished ON outbox (id) WHERE published_at IS NULL;
```

### 7.3 The six modelling decisions worth defending

**1 — Hybrid relational + JSONB, deliberately; not one or the other.**
The skeleton (`category → product → variant → asset → document`, plus the `product ↔ industry`
many-to-many) is a fixed graph with real integrity rules, so it is relational with enforced foreign
keys. The spec sheet is *not* fixed: a blast freezer has pull-down time, a wine chiller has bottle
count, a serve-over has pane geometry. Those live in `product.specs` behind a GIN index, with a
per-category JSON Schema validating them on write. A new product family therefore ships with zero
migration, while foreign keys still make orphaned variants and dangling assets impossible.

**2 — The variant, not the product, is the unit of truth for specs.**
The reference site shows one "Blast Freezer" page but sells many model codes. Dimensions, capacity,
energy class and price belong to the SKU; marketing copy belongs to the product. Collapsing the two
is the mistake that forces a schema rewrite in year two, the moment someone asks for a price list
or a dealer stock feed.

**3 — Bytes never go in the database.**
`asset` holds metadata plus a `storage_key`; object storage holds the file; the CDN serves it. This
keeps the Postgres working set in RAM and keeps restores measured in minutes rather than hours.

**4 — Content is versioned; demand is immutable.**
`content_revision` keeps a full JSONB snapshot per publish. `lead` and `application` rows are never
edited in place — status transitions append to `audit_log`, which is how you answer *"who touched
this enquiry, and when"* during a commission dispute. The app role is granted `INSERT` only on
`audit_log`; no `UPDATE`, no `DELETE`.

**5 — Derived stores are disposable.**
The search index, Redis and the warehouse can all be dropped and rebuilt from Postgres. Nothing is
stored *only* in them. That single rule is what keeps one backup, one restore drill and one
source of truth.

**6 — Index types come from the query shape, not from habit.**

| Index | Where | Query it serves |
|---|---|---|
| GiST | `category.path`, `installation.geo` | Subtree/ancestor reads; radius and nearest-neighbour search |
| GIN | `product.specs`, `search_tsv`, `news_post.tags` | JSON containment, full-text ranking, array overlap |
| BRIN | `created_at`, `published_at` | Append-only time columns — roughly 1000× smaller than a B-tree |
| Partial | `outbox WHERE published_at IS NULL` | The relay's poll; stays small no matter how big the table grows |

---

## 8. ADR-0001 — Database selection

> **Decision:** PostgreSQL 16 as the single system of record.
> **Status:** Accepted. **Revisit trigger:** p95 primary CPU > 60 % sustained for 7 days, or a
> write workload that is no longer dominated by human actions.

### 8.1 Why PostgreSQL

**The shape of the domain fits it.** Roughly 90 % of this system is relational with hard integrity
rules; the remaining 10 % (spec sheets, page blocks, UTM payloads, ATS answers) is document-shaped.
Postgres is the only mainstream engine that is genuinely first-class at both. JSONB + GIN delivers
MongoDB's flexibility without surrendering joins, foreign keys or transactions — which removes the
entire case for a document database here.

**The one thing that must not break is transactional.** `lead + lead_item + outbox` must commit or
fail as a unit. ACID gives that in a single statement, with no distributed-transaction machinery
and no dual-write race.

**It absorbs the next three roadmap features without introducing a new datastore:**

| Roadmap need | Postgres answer | Datastore avoided |
|---|---|---|
| Catalogue search | `tsvector` + `pg_trgm` — good to ~10⁵ documents | Elasticsearch, until phase 2 |
| Dealer / installation map | PostGIS radius + KNN | A separate geo service |
| "Similar products", AI spec assistant | `pgvector`, embeddings next to the row they describe | A dedicated vector DB |
| Cabinet IoT telemetry (phase 3) | TimescaleDB hypertables | InfluxDB / Timestream |

One engine to operate, back up, monitor, tune and hire for. That consolidation is the real saving,
and it is larger than any per-workload benchmark difference at this scale.

**Read scaling is boring and proven.** Streaming read replicas behind PgBouncer absorb a 100× read
spike, and 95 % of reads never reach the database because the CDN already answered. Writes are in
the hundreds per day — a single primary is correct for years, and saying so explicitly is part of
the design rather than an omission.

**Change data capture is native.** Logical decoding plus Debezium turns every commit into an event
for the search indexer, cache purge and the warehouse. Combined with the outbox table, this
eliminates the dual-write bug class entirely.

**It is cheap, portable and hard to get locked into.** RDS, Aurora, Cloud SQL, Neon, Supabase or a
plain VM — same SQL, same dump. The exit cost is a `pg_dump`, which is exactly the property you
want in a vendor decision you cannot yet justify revisiting.

**Limits accepted, with mitigations written down:** single writer (fine at this write volume);
vacuum and bloat need monitoring; connection cost needs PgBouncer; major-version upgrades need a
rehearsed blue/green drill. All standard, all in the runbook.

### 8.2 Why not the alternatives

| Candidate | Verdict | Reasoning |
|---|---|---|
| **MongoDB** | Rejected | The catalogue is a graph with integrity rules, not a pile of documents. Orphaned variants and dangling asset references are the number-one CMS bug class, and Mongo cannot express the constraint that prevents them. `$lookup` is weak and slow for the faceted admin queries this team runs daily, and multi-document transactions remain a bolt-on. Its one genuine advantage — schemaless specs — is already covered by JSONB + GIN with joins left intact. Choosing it means hand-rolling referential integrity in application code forever. |
| **DynamoDB** | Rejected | Excellent when every access pattern is known up front and write scale is unbounded. We have neither. *"Products where capacity > 600 L and refrigerant = R290, faceted by industry"* is ad-hoc by nature, and BI needs joins. You would pay in GSI sprawl, denormalisation and write amplification for a workload of tens of writes per day. Right tool, wrong problem. |
| **MySQL / Aurora MySQL** | Viable, not chosen | This would genuinely work; it is not a bad answer. What it costs: GIN-indexed JSON containment, `tsvector` ranking, `ltree`, PostGIS, `pgvector`, exclusion constraints, and Debezium-grade logical decoding. Every one of those is already on the roadmap. **Pick MySQL only if the team's existing operational muscle is MySQL** — that reason legitimately beats this list. |
| **Firestore** | Rejected | Weak ad-hoc querying, per-read billing that punishes a crawler walking the catalogue, no SQL for BI, heavy lock-in. |
| **Airtable / Google Sheets as the backend** | Rejected | Genuinely tempting at 350 SKUs and will work for a quarter. Then: no transactions, no referential integrity, hard API rate limits, no migration path, and the business is now hostage to a spreadsheet. |
| **Supabase** | Not a separate option | Supabase *is* Postgres. Choosing it is a hosting decision, not a database decision — and a reasonable one for phase 1. |
| **Elasticsearch / OpenSearch as primary** | Rejected | No transactions, no foreign keys, painful and lossy on mapping changes, and a reindex bug becomes permanent data loss rather than a cache miss. Correct role: a derived, disposable index fed by CDC. The same reasoning excludes Redis-as-database. |
| **Headless SaaS CMS alone** (Contentful, Sanity) | Partially adopted | Superb editor experience for pages and news, and worth paying for. But product specs, RFQ leads and CV applications need our own transactional store, real joins, and our own retention and erasure controls — and per-record SaaS pricing across 350 SKUs × N locales is poor value. **Chosen middle path: Payload or Strapi running on *our* Postgres.** One schema, one backup, one restore drill, and the editors still get a good CMS. |

### 8.3 Supporting stores, and why each exists

| Store | Role | Why not Postgres for this |
|---|---|---|
| Redis | Fragment cache, rate-limit buckets, idempotency keys, locks, staff sessions | Rate limiting at request rate would be write amplification on the primary. Chosen over Memcached for native data structures (sorted sets for token buckets), TTL semantics and pub/sub. |
| OpenSearch / Typesense *(phase 2)* | Faceted catalogue search, typo tolerance, synonyms, PDF full text | `tsvector` has no typo tolerance and no facet aggregation. Deferred until the catalogue or query volume justifies it. |
| S3 / GCS | Images, PDFs, CVs | Large objects in a database destroy the buffer-cache hit rate and inflate every backup. |
| ClickHouse / BigQuery | Clickstream, funnel, attribution | Analytical scans on the primary would compete with serving traffic. Never on the serving path. |

---

## 9. Cross-cutting concerns

**Caching.** Three tiers: CDN (HTML + assets, surrogate-key purge), Redis (fragments and API
responses), and the Postgres buffer cache. Invalidation is **event-driven, never TTL-only** —
`catalog.changed` fans out to a tag purge, so correctness does not wait for an expiry.

**Search.** Phase 1 is `tsvector` with weighted fields plus `pg_trgm` for fuzzy model-code lookup.
Phase 2 adds a derived index for facets and typo tolerance, fed by CDC and rebuildable from scratch.

**Security.** Strict CSP with SRI; signed upload and download URLs; AV scan on every CV before it is
readable; PII columns encrypted at rest with KMS envelope keys; least-privilege IAM; dependency
scanning in CI; quarterly penetration test.

**Privacy and compliance.** India's DPDP Act drives a recorded `consent_at` on every lead, a
documented retention period with automated purge, and a working erasure path. GDPR applies to EU
traffic — the site serves a global brand. Newsletter uses double opt-in, which is both good practice
and the consent evidence.

**Observability.** OpenTelemetry traces end to end; Prometheus + Grafana for infrastructure; Sentry
for exceptions; RUM for field Core Web Vitals; structured JSON logs keyed by `request_id`. Alerts
are multi-window burn-rate on the SLOs in §3, not CPU thresholds.

**CI/CD.** Target: `lint → typecheck → unit → Playwright e2e → Lighthouse budget → terraform plan
→ preview environment → blue/green with automatic rollback`. Infrastructure is Terraform only; no
change is made in a cloud console.

*As built, 2026-10-12.* `.github/workflows/deploy-production.yml` and `deploy-preview.yml` run
`typecheck → lint → vercel build → vercel deploy --prebuilt`, gated so a red check blocks the
deploy. `vercel.json` sets `git.deploymentEnabled: false`, because otherwise Vercel's own Git
integration deploys the same commit a second time. Still missing from the target: unit tests, the
e2e suite, the Lighthouse budget and Terraform. The missing e2e suite is not a cosmetic gap — see
§6.1.

One host-specific trap, recorded so nobody loses an afternoon to it. `vercel build` de-duplicates
identical serverless functions by replacing them with symlinks, and **on Windows it writes those
link targets with backslashes**, which are not path separators on Vercel's Linux builder. A
`vercel deploy --prebuilt` from a Windows machine therefore fails with
`ENOENT ... _not-found.func`. The GitHub Actions runners are Linux and are unaffected. Deploy from
CI, or from source without `--prebuilt`.

---

## 10. Scaling plan — triggered by metrics, not dates

| Phase | Target | Topology | Trigger to move on |
|---|---|---|---|
| **0 — today** | Demo | Static HTML + CSS on a CDN. Zero servers. | A non-developer must publish, or SKUs pass ~30, or the same spec appears on four pages and they start to disagree. |
| **1 — Q1** | 0–50k MAU | Next.js on Vercel/Cloud Run · managed Postgres 2 vCPU/8 GB · S3 + CDN · Resend · Payload CMS on the same Postgres · modular monolith. Search = `tsvector`. Queue = outbox + cron worker. No Redis, no Kafka, no mesh. **≈ ₹15–25k/month; two engineers can run it.** | Search latency, or a second locale, or CRM integration lands. |
| **2** | 50k–500k MAU, multi-locale | Add 2 read replicas + PgBouncer · Redis · OpenSearch + CDC indexer · SQS + autoscaled workers · image CDN · i18n + hreflang · CRM sync · ClickHouse for attribution. Still one codebase. | p95 primary CPU > 60 % for 7 days, **or** deploy lead time > 1 day, **or** two teams blocked on one repository. |
| **3** | > 1M MAU, dealer portal, IoT | Extract Search, Media, Notification (in that order). Kafka replaces SQS. Multi-region: single writer region + regional read replicas + regional ISR. TimescaleDB for cabinet telemetry, `pgvector` for the AI spec assistant. | — |

---

## 11. Risks and the mitigations we actually build

| # | Risk | What gets built |
|---|---|---|
| 1 | **SEO regression on migration** — the existing URLs are the asset, and a rebuild is the most common way to lose organic traffic | Crawl and freeze the current URL inventory; redirect table loaded into edge KV; pre-launch diff of titles, canonicals and structured data; staged traffic rollout with rank monitoring |
| 2 | **Silent lead loss** — invisible and expensive | Synthetic end-to-end lead probe every 5 min; alert on zero leads in a business hour; DLQ depth alarm; weekly DB-vs-CRM reconciliation. **Status 2026-10-12: the probe is not built, and this risk has already materialised** — see §6.1. The "zero leads in 24 h" alarm *is* built, in the guardrail cron. |
| 3 | **Spam and competitor price scraping** | Turnstile + honeypot + per-IP buckets; dealer pricing behind an authenticated scope from phase 3 rather than in public HTML. **Status: honeypot and per-IP buckets built; Turnstile server-side only, no widget.** |
| 4 | **Image bloat from marketing uploads** — the usual cause of a slow site | Media service enforces max dimensions, generates AVIF/WebP variants, rejects files over 8 MB, emits a blurhash placeholder |
| 5 | **Single-writer Postgres is a single point of failure** | Multi-AZ with automatic failover; PgBouncer reconnect; read-only degraded mode so the catalogue keeps serving from cache while the primary is replaced |
| 6 | **Vendor concentration** (one PaaS + one CDN) | Ship as a container, keep the database as plain Postgres — leaving is a weekend, not a rewrite |

---

## 12. Open questions for the business

1. **Is pricing public?** If dealer pricing ever goes on the site, the dealer portal moves from
   phase 3 into phase 2 and authentication becomes a v1 concern.
2. **How many locales, and when?** The schema supports it today; `hreflang` and the translation
   workflow are real cost once committed.
3. **Which CRM?** It determines the lead payload contract and whether the sync is push or pull.
4. **Is the events microsite** (the reference site runs `events.` on a subdomain) **a separate
   deploy or a route?** A route is cheaper; a subdomain isolates campaign traffic spikes.
5. **Who owns publishing?** The RBAC model in `role_binding` assumes marketing, product and HR are
   separate roles with separate scopes. Confirm before building the admin UI.
