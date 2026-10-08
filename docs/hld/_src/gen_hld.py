# -*- coding: utf-8 -*-
"""HLD canvas for the SS / KALT commercial-refrigeration platform."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_core import (OPS, PAL, INK, SUB, MUTE, rect, text, arrow, line, box, row,
                      grid, wrap, to_excalidraw, to_svg)

GUT = 180          # left gutter for layer labels
CX = 200           # content x
CW = 2200          # content width
BW = CX + CW       # band width  = 2400
RAIL_X, RAIL_W = 2460, 460
W_ALL = RAIL_X + RAIL_W          # 2920
GAP = 58

# ------------------------------------------------------------------ helpers
def h1(y, t, sub=None):
    text(0, y, wrap(t, W_ALL, 34, False, 0), 34, INK, "left", False, 1.18, W_ALL)
    y += 34 * 1.18 + 8
    if sub:
        ls = wrap(sub, W_ALL, 15, False, 0)
        text(0, y, ls, 15, MUTE, "left", False, 1.4, W_ALL)
        y += len(ls) * 15 * 1.4
    return y + 26


def h2(y, t, sub=None, w=W_ALL):
    text(0, y, wrap(t, w, 24, False, 0), 24, INK, "left", False, 1.2, w)
    y += 24 * 1.2 + 6
    if sub:
        ls = wrap(sub, w, 14, False, 0)
        text(0, y, ls, 14, MUTE, "left", False, 1.4, w)
        y += len(ls) * 14 * 1.4
    return y + 20


def band(y, label, specs, cols=None, **kw):
    bg = rect(0, y, BW, 10, PAL["band"][0], PAL["band"][1], sw=1.5, r=14, dash="dashed")
    lab = wrap(label, GUT, 15, False, 10)
    text(18, y + 20, lab, 15, PAL[kw.pop("tone", "plat")][1], "left", False, 1.25, GUT - 24)
    iy = y + 22
    if cols:
        h = grid(specs, CX, CW, iy, cols, **kw)
    else:
        h = row(specs, CX, CW, iy, **kw)
    bg["h"] = max(h + 44, len(lab) * 15 * 1.25 + 40)
    return y + bg["h"]


def cluster(x, y, w, title, note, specs, cols, min_h=150):
    bg = rect(x, y, w, 10, "#fdfdfe", "#adb5bd", sw=1.5, r=14, dash="dashed")
    text(x + 22, y + 18, wrap(title, w - 44, 18, False, 0), 18, INK, "left", False, 1.2, w - 44)
    ny = y + 18 + 18 * 1.2 + 4
    nl = wrap(note, w - 44, 12, False, 0)
    text(x + 22, ny, nl, 12, MUTE, "left", False, 1.35, w - 44)
    iy = ny + len(nl) * 12 * 1.35 + 14
    h = grid(specs, x + 22, w - 44, iy, cols, gap=18, vgap=18, min_h=min_h,
             fs_t=14, fs_b=11, mono_body=True, align="left", vtop=True)
    bg["h"] = (iy - y) + h + 22
    return bg["h"]


# =========================================================== TITLE
cur = 0
cur = h1(cur,
         "KALT / SS Commercial Refrigeration — High-Level Design",
         "Public brand site + product catalogue + technical resource centre + lead engine, "
         "modelled on williamsrefrigeration.co.in.   Owner: platform eng   Rev 1.0   2026-10-07\n"
         "Design stance: this is a read-heavy, low-write, SEO-critical B2B site. The scaling risk is "
         "NOT queries per second — it is content velocity, crawlability and never dropping an enquiry. "
         "So: cheap and boring today, with the seams pre-cut where the next 10x actually lands.")

arch_top = cur

# =========================================================== REGION A
cur = h2(cur, "1 · Runtime architecture — request path, top to bottom")
bands = []

y = cur
b = y
y = band(y, "(1) CLIENTS\n& CHANNELS", [
    ("Visitor browser\n~70% mobile",
     "Chrome / Safari on 4G India.\nCore Web Vitals is a ranking\nfactor, so it is a hard budget.", "client"),
    ("Search & AI crawlers",
     "Googlebot, Bingbot, GPTBot.\nNeed server-rendered HTML +\nschema.org, not client JSON.", "client"),
    ("Editor console",
     "Marketing + product team\npublish SKUs, specs, PDFs,\nnews, events, jobs.", "client"),
    ("Sales / service desk",
     "Works the enquiry + RFQ\nqueue, assigns owner,\nexports to CRM.", "client"),
    ("Phase 3: dealer portal\n+ field app",
     "Dealer pricing, stock,\nwarranty registration,\nservice tickets.", "client"),
], fs_t=15, fs_b=11.5, min_h=118, tone="client")
bands.append((b, y, "HTTPS / HTTP3  ·  one TLS hop"))

y += GAP; b = y
y = band(y, "(2) EDGE\nGLOBAL POP", [
    ("DNS + Anycast + TLS 1.3",
     "Route 53 / Cloudflare.\nHSTS, HTTP/3, OCSP staple.", "edge"),
    ("CDN — HTML *and* asset cache",
     "s-maxage + stale-while-revalidate.\nSurrogate-key purge per entity.\n~95% of requests never reach origin.", "edge"),
    ("WAF · bot mgmt · DDoS",
     "OWASP core rules, per-IP token\nbucket, Turnstile on every form,\nL3/L7 absorb at the edge.", "edge"),
    ("Image CDN",
     "On-the-fly resize, AVIF/WebP,\nDPR-aware srcset. Egress is the\nreal bill on a photo-heavy site.", "edge"),
    ("Edge middleware (KV)",
     "Locale + geo routing, the 301\nredirect map, A/B bucketing.\nRuns in <5 ms, no origin hop.", "edge"),
], fs_t=15, fs_b=11.5, min_h=128, tone="edge")
bands.append((b, y, "cache MISS only  (~5% of traffic)"))

y += GAP; b = y
y = band(y, "(3) WEB TIER\nNext.js App\nRouter", [
    ("SSG — marketing surface",
     "Home, about, industries, quality,\nsustainability, awards. Built at\ndeploy, pure static at the edge.", "web"),
    ("ISR — catalogue, news, installs",
     "Time-based revalidate PLUS\non-demand revalidateTag() fired\nby the publish event. Fresh + fast.", "web"),
    ("SSR / streaming RSC",
     "Faceted product listing, search\nresults, dealer locator, forms.\nStreamed so LCP paints early.", "web"),
    ("Route handlers = BFF",
     "One aggregate call per page.\nDomain services are never\nexposed to the browser.", "web"),
], fs_t=15, fs_b=11.5, min_h=128, tone="web")
bands.append((b, y, "server-side fetch, private network"))

y += GAP; b = y
y = band(y, "(4) API EDGE", [
    ("API gateway / ingress",
     "OpenAPI contract, /v1 versioning,\nmTLS inside the mesh.", "gw"),
    ("AuthN + RBAC",
     "OIDC for staff, short-lived JWT,\nper-service scopes.", "gw"),
    ("Validation + idempotency",
     "zod/JSON-Schema on every body;\nIdempotency-Key on POST /leads.", "gw"),
    ("Quotas + circuit breaker",
     "Redis token bucket, bulkhead and\ntimeout per upstream SaaS.", "gw"),
], fs_t=15, fs_b=11.5, min_h=104, tone="gw")
bands.append((b, y, "gRPC / REST"))

y += GAP; b = y
y = band(y, "(5) DOMAIN\nSERVICES\n\nmodular monolith\nnow, split on the\nmarked seams later", [
    ("Catalog", "Categories, products, variants,\nspec sheets, feature blocks,\nindustry mapping.", "svc"),
    ("Content / CMS", "Pages, typed blocks, news,\ninstallations, awards, certs,\nrevisions + preview.", "svc"),
    ("Lead & RFQ", "Contact, quote cart, callback,\nnewsletter. Dedupe, scoring,\nterritory routing.", "svc"),
    ("Careers / ATS", "Jobs, applications, CV intake,\nstages, speculative CVs.", "svc"),
    ("Search  [seam]", "Query parse, facet build,\nsynonyms, relevance tuning,\nspec-range filters.", "svc"),
    ("Media & Docs  [seam]", "Signed upload, AV scan, image\nvariants, PDF text extract,\nsigned download URLs.", "svc"),
    ("Notification  [seam]", "Templated email / WhatsApp /\nSMS. Retry, DLQ, bounce\nhandling, suppression list.", "svc"),
    ("Identity & Audit", "Staff users, roles, scopes,\nimmutable audit trail.", "svc"),
], cols=4, fs_t=15, fs_b=11.5, min_h=104, tone="svc")
bands.append((b, y, "SQL via PgBouncer  ·  Redis  ·  S3"))

y += GAP; b = y
y = band(y, "(6) DATA PLANE", [
    ("PostgreSQL 16\nSYSTEM OF RECORD",
     "Primary writer + 2 streaming read\nreplicas, PgBouncer pooling,\nmulti-AZ failover, PITR 7 days,\nlogical decoding for CDC.\nEverything else is derived.", "pick"),
    ("Redis",
     "Fragment + API cache, rate-limit\nbuckets, idempotency keys,\ndistributed locks, staff session.\nDisposable by design.", "data"),
    ("OpenSearch / Typesense\n(phase 2)",
     "Derived index: products, variants,\nPDF text. Facets, typo tolerance,\nsynonyms. Fully rebuildable\nfrom Postgres in minutes.", "data"),
    ("Object storage (S3 / GCS)",
     "Images, catalogues, datasheets,\nCVs. Versioned, private, served\nonly via signed URL + CDN.\nBytes never live in the DB.", "data"),
    ("ClickHouse / BigQuery",
     "Clickstream, funnel, lead\nattribution, download analytics.\nNever on the serving path.", "data"),
    ("Postgres extensions\n= future datastores avoided",
     "PostGIS -> dealer + install map\npgvector -> similar-product / AI\nTimescale -> cabinet telemetry\npg_trgm + tsvector -> phase-1 search", "data"),
], fs_t=14.5, fs_b=11.5, min_h=160, tone="data")
bands.append((b, y, "WAL -> logical decoding   +   transactional outbox"))

y += GAP; b = y
y = band(y, "(7) ASYNC\nBACKBONE", [
    ("Transactional outbox",
     "Event row written in the SAME\ntransaction as the business row.\nNo dual-write bug, no 2PC.", "async"),
    ("Debezium CDC -> SQS / Kafka",
     "Topics: catalog.changed,\nlead.created, media.uploaded,\ncontent.published.", "async"),
    ("Workers (autoscaled)",
     "Email send, image variants,\nPDF thumb + text extract,\nCV virus scan, CRM upsert.", "async"),
    ("Search indexer",
     "Consumes catalog.changed ->\nbulk upsert, 1s debounce.\nNightly full reconcile.", "async"),
    ("Cache & SEO fan-out",
     "Surrogate-key purge, ISR\nrevalidateTag, sitemap diff,\nIndexNow ping to Google/Bing.", "async"),
], fs_t=14.5, fs_b=11.5, min_h=132, tone="async")
bands.append((b, y, "at-least-once + DLQ + retry with jitter"))

y += GAP; b = y
y = band(y, "(8) EXTERNAL\nSaaS\n\nall behind a\ncircuit breaker,\nnone on the\nuser's path", [
    ("Email — SES / Resend", "DKIM + SPF + DMARC,\nbounce + complaint webhook.", "ext"),
    ("CRM — Zoho / Salesforce", "Idempotent upsert keyed on\nlead.id. Nightly reconcile.", "ext"),
    ("Turnstile / reCAPTCHA v3", "Score-gated submit +\nhoneypot + time-to-fill check.", "ext"),
    ("WhatsApp / SMS", "Gupshup / Twilio. RFQ ack to\ncustomer, ping to sales rep.", "ext"),
    ("Maps — Google / Mapbox", "Dealer locator and the\ninstallations map.", "ext"),
    ("GA4 · Sentry · RUM", "Consent-gated, cookieless\nfallback for EU traffic.", "ext"),
], cols=6, fs_t=14, fs_b=11, min_h=100, tone="ext")
arch_bottom = y

# ---- right rail
rbg = rect(RAIL_X, arch_top, RAIL_W, arch_bottom - arch_top, PAL["plat"][0],
           PAL["plat"][1], sw=1.5, r=14, dash="dashed")
ry = arch_top + 20
text(RAIL_X + 20, ry, wrap("(9) PLATFORM & GOVERNANCE", RAIL_W - 40, 17, False, 0),
     17, INK, "left", False, 1.2, RAIL_W - 40)
ry += 17 * 1.2 + 14
rail = [
    ("Observability",
     "OpenTelemetry traces end to end.\nPrometheus + Grafana, Sentry,\nCWV field data via RUM, structured\nJSON logs keyed by request_id.", "plat"),
    ("SLOs + error budget",
     "Site 99.9% · POST /v1/leads 99.95%\nTTFB p75 <400ms · API p99 <300ms\nMulti-window burn-rate alerts.\nBudget spent -> feature freeze.", "plat"),
    ("CI / CD",
     "lint -> typecheck -> unit ->\nPlaywright e2e -> Lighthouse budget\n-> terraform plan -> preview env ->\nblue/green with auto-rollback.", "plat"),
    ("IaC & environments",
     "Terraform modules, dev/stage/prod\nparity, drift detection, zero\nchanges made in a cloud console.", "plat"),
    ("Secrets & keys",
     "KMS envelope encryption, Vault /\nSecrets Manager, 90-day rotation,\nnothing secret in the repo.", "plat"),
    ("Security",
     "Strict CSP + SRI, signed upload\nURLs, AV scan, PII columns\nencrypted, least-privilege IAM,\nquarterly pen test + dep scanning.", "plat"),
    ("Compliance & a11y",
     "India DPDP Act: consent record +\nretention + erasure. GDPR for EU.\nWCAG 2.2 AA with axe in CI.\nschema.org Product/Org/Breadcrumb.", "plat"),
]
for t, bd, s in rail:
    hh = box(RAIL_X + 20, ry, RAIL_W - 40, 120, t, bd, s, fs_t=15, fs_b=11.5,
             align="left", vtop=True, fill="#ffffff")
    ry += hh + 14
rbg["h"] = max(rbg["h"], ry - arch_top + 8)

# ---- inter-band arrows
for (b0, b1, lbl) in bands:
    mid = b1 + GAP / 2.0
    arrow(1180, b1 + 6, 1180, b1 + GAP - 6, stroke="#212529", sw=3)
    text(1206, mid - 9, wrap(lbl, 1100, 12.5, False, 0), 12.5, SUB, "left", False, 1.3, 1100)

cur = arch_bottom + 70

# =========================================================== REGION A2
cur = h2(cur, "2 · The two paths that must not break",
         "Everything else on this page can degrade. These two define the business.")
flow_w = (W_ALL - 40) / 2.0
hL = box(0, cur, flow_w, 300,
         "A · Lead capture — zero tolerance for a dropped enquiry",
         "1   POST /v1/leads   with Idempotency-Key (collapses double-clicks + client retries)\n"
         "2   Edge: Turnstile score + honeypot + time-to-fill + per-IP Redis bucket\n"
         "3   Validate, normalise phone/email, hash the IP (abuse only, never stored raw)\n"
         "4   ONE Postgres transaction:   INSERT lead  +  INSERT lead_item[]  +  INSERT outbox('lead.created')\n"
         "5   Respond 202 with lead_ref — the user sees success in under 300 ms\n"
         "6   Worker drains outbox -> email to sales + ack to customer + CRM upsert + WhatsApp ping\n"
         "7   CRM or mail provider down? The row stays in outbox. Exponential retry, then DLQ + page.\n\n"
         "WHY: the database commit is the durability boundary, and no third party sits on the\n"
         "user's request path. A SaaS outage delays notification; it never loses the lead.\n"
         "Verification: a synthetic lead is submitted every 5 minutes end to end, and an alert\n"
         "fires on zero real leads during a business hour — silent form failure is the expensive bug.",
         "note", fs_t=17, fs_b=12.5, align="left", vtop=True)
hR = box(flow_w + 40, cur, flow_w, 300,
         "B · Publish — editor click to live page, p95 under 30 s",
         "1   Editor saves -> content_revision row (draft, full JSONB snapshot); media via signed PUT to S3\n"
         "2   Publish -> txn:  UPDATE product SET status='live', version=version+1  +  outbox('catalog.changed')\n"
         "3   Indexer bulk-upserts the changed documents into OpenSearch (1 s debounce)\n"
         "4   Purge worker: CDN surrogate-key purge  +  Next.js revalidateTag('product:<id>')\n"
         "5   Sitemap diff regenerated per locale, IndexNow ping to Google and Bing\n"
         "6   Rollback = publish the previous revision. No deploy, no DBA, no downtime.\n\n"
         "WHY tag-based purge and not a wildcard: a spec correction on one SKU must not cold-start\n"
         "the whole catalogue and hand every visitor an origin round-trip. Each rendered page\n"
         "declares the entity tags it read, so invalidation is exactly as wide as the change.\n"
         "WHY a revision snapshot and not a diff: at ~20 publishes a week the storage is free and\n"
         "'restore exactly what was live on the day of the trade show' becomes a one-row operation.",
         "note", fs_t=17, fs_b=12.5, align="left", vtop=True)
cur += max(hL, hR) + 70

# =========================================================== REGION B
cur = h2(cur, "3 · Data model — one PostgreSQL instance, five bounded contexts",
         "FK = foreign key.  jsonb columns carry the parts of the domain that genuinely vary by "
         "product family.  Index type is called out where the query shape demands a specific one.")

c1 = cluster(0, cur, 1180, "CATALOG",
             "The commercial core: 3 top-level ranges, ~25 collections, ~350 sellable model codes.",
             [
                 ("category", "id            uuid pk\nslug          text unique\nparent_id     FK -> category\npath          ltree  (GiST)\nname, kind, sort_order\nseo           jsonb\n\n-- ltree returns a whole\n-- breadcrumb or subtree\n-- in one indexed query", "white"),
                 ("product", "id            uuid pk\nslug          text unique\ncategory_id   FK -> category\nname, series, status enum\nsummary       text\nspecs         jsonb  (GIN)\nsearch_tsv    tsvector (GIN)\nversion       int\npublished_at  timestamptz", "white"),
                 ("product_variant", "id            uuid pk\nproduct_id    FK -> product\nmodel_code    text unique  <- SKU\ncapacity_l, gn_config\ntemp_min_c, temp_max_c\nrefrigerant, ambient_max_c\npower_w, energy_class\ndims_mm jsonb, weight_kg\nmrp_inr       numeric null", "white"),
                 ("feature_block", "id, product_id FK\nkind enum(standard|optional\n     |key|common|hygiene\n     |energy|value|quality)\nheading, body_md\nicon, sort_order\n\n-- mirrors the 7 feature\n-- sections on a Williams\n-- product page exactly", "white"),
                 ("industry", "id, slug unique, name\nicon, blurb\nsort_order\n\n-- gelato, patisserie,\n-- bakery, QSR, bar,\n-- supermarket, cold room,\n-- Indian sweets", "white"),
                 ("product_industry", "product_id   FK -> product\nindustry_id  FK -> industry\nPRIMARY KEY (both)\n\n-- pure m:n join table;\n-- powers every 'solutions\n-- by industry' landing\n-- page and its facet", "white"),
                 ("asset", "id            uuid pk\nkind enum(image|pdf|video)\nstorage_key   text\nmime, bytes\nwidth, height, blurhash\nchecksum_sha256 unique\nalt_text, credit\nvariants      jsonb\n-- metadata only; S3 has bytes", "white"),
                 ("product_asset", "product_id   FK -> product\nasset_id     FK -> asset\nrole enum(hero|gallery\n     |cutout|dimension\n     |badge|lifestyle)\nsort_order\nPK (product_id, asset_id,\n    role)", "white"),
                 ("document", "id, title\ntype enum(catalogue|datasheet\n     |manual|certificate|cad)\nproduct_id   FK null\ncategory_id  FK null\nasset_id     FK -> asset\nlocale, revision\ngated bool, download_count\n-- the /downloads centre", "white"),
             ], 3, min_h=200)

c2 = cluster(1220, cur, 820, "CONTENT",
             "Editorial surface. Typed blocks mean a new section design needs no migration.",
             [
                 ("page", "id, slug unique, title\ntemplate enum\nstatus, locale\nseo jsonb\n-- about, quality,\n-- sustainability, contact", "white"),
                 ("content_block", "id, page_id FK -> page\ntype enum(hero|stat|rail\n     |timeline|bento|gallery\n     |cta|richtext|slider)\nsort_order, data jsonb\n-- new section = no DDL", "white"),
                 ("news_post", "id, slug unique, title\nexcerpt, body_md\nhero_asset_id FK -> asset\ntags text[]  (GIN)\npublished_at (BRIN)\nauthor_id FK -> app_user", "white"),
                 ("installation", "id, slug unique, title\nclient_name, city, state\nindustry_id FK -> industry\ngeo geography(Point)\n     <- PostGIS, GiST\nyear, body_md", "white"),
                 ("award_cert", "id, title, body\nissuer, issued_on\nexpires_on\nasset_id FK -> asset\nkind enum(award|iso|ce\n     |test_report)", "white"),
                 ("content_revision", "id, entity_type, entity_id\nversion int\npayload jsonb <- snapshot\nauthor_id, created_at\nUNIQUE(entity_type,\n   entity_id, version)", "white"),
             ], 2, min_h=168)

c3 = cluster(2100, cur, 820, "DEMAND  &  CAREERS",
             "The revenue and hiring funnels. Append-only in spirit; edits go to audit_log.",
             [
                 ("lead", "id uuid pk, ref text unique\ntype enum(contact|rfq\n     |support|callback|demo)\nname, email, phone, company\ncity, message\nsource jsonb (utm, referrer)\nstatus enum, owner_id FK\ncrm_ref, consent_at\nip_hash, created_at (BRIN)", "white"),
                 ("lead_item", "lead_id    FK -> lead\nproduct_id FK null\nvariant_id FK null\nqty, note\n-- the 'quote cart':\n-- an RFQ is one lead\n-- plus N line items", "white"),
                 ("newsletter_subscriber", "id, email citext unique\nstatus enum(pending\n     |confirmed|unsubscribed)\nconfirm_token, confirmed_at\nunsub_at, source\n-- double opt-in is the\n-- DPDP consent proof", "white"),
                 ("job", "id, slug unique, title\ndepartment, location\nemployment_type\ndescription_md\nstatus enum, openings\nposted_at, closes_at", "white"),
                 ("application", "id, job_id FK null\n   (null = speculative CV)\nname, email, phone\ncv_asset_id FK -> asset\nanswers jsonb\nstage enum, rating\nUNIQUE(job_id, email)", "white"),
                 ("outbox", "id bigserial pk\naggregate_type, aggregate_id\nevent_type, payload jsonb\ncreated_at, published_at null\nattempts int, last_error\nPARTIAL INDEX WHERE\n  published_at IS NULL", "white"),
             ], 2, min_h=168)
cur += max(c1, c2, c3) + 30

c4 = cluster(0, cur, 1180, "PLATFORM  &  SEO",
            "Small tables that prevent large outages.",
            [
                ("app_user", "id, email unique\nname, idp_sub\nstatus, last_login_at\n-- staff only. Visitors are\n-- never accounts until the\n-- phase-3 dealer portal.", "white"),
                ("role_binding", "user_id FK -> app_user\nrole enum(admin|editor\n     |sales|hr|viewer)\nscope text (e.g. catalog:*)\nPK(user_id, role, scope)", "white"),
                ("audit_log", "id bigserial, actor_id\naction, entity_type, entity_id\ndiff jsonb, ip, ua, at\nAPPEND-ONLY: no UPDATE or\nDELETE grant to the app role\nmonthly partitions -> cold", "white"),
                ("redirect", "from_path text pk\nto_path, status 301|302\nhits, created_by, created_at\n-- survives every IA change;\n-- loaded into edge KV so a\n-- redirect costs no origin hop", "white"),
                ("locale + translation", "locale: code pk, name, rtl\ntranslation:\n (entity_type, entity_id,\n  field, locale) -> value\nPK on all four columns\n-- en-IN now; ar/fr later\n-- with zero schema change", "white"),
                ("feature_flag", "key text pk\nenabled bool, rollout_pct\nrules jsonb\n-- dark-launch the build-and-\n-- price configurator, the\n-- dealer portal, a new PDP", "white"),
            ], 3, min_h=168)

hK = box(1220, cur, 1700, 100,
         "Key modelling decisions (the ones that get argued about in review)",
         "1  Hybrid relational + JSONB, deliberately — not one or the other.\n"
         "   The skeleton (category -> product -> variant -> asset -> document, plus the product<->industry m:n)\n"
         "   is a fixed graph with real integrity rules, so it is relational with enforced foreign keys. The spec\n"
         "   sheet is not fixed: a blast freezer has pull-down time, a wine chiller has bottle count, a serve-over\n"
         "   has pane geometry. Those live in product.specs / variant.dims_mm as JSONB behind a GIN index, with a\n"
         "   per-category JSON Schema validating them on write. A new product family therefore ships with zero\n"
         "   migration, while foreign keys still make orphaned variants and assets impossible.\n\n"
         "2  The VARIANT, not the product, is the unit of truth for specs.\n"
         "   Williams shows one 'Blast Freezer' page but sells many model codes. Dimensions, capacity, energy class\n"
         "   and price belong to the SKU; marketing copy belongs to the product. Collapsing the two is the single\n"
         "   mistake that forces a schema rewrite in year two, the moment someone asks for a price list.\n\n"
         "3  Bytes never go in the database. asset holds metadata plus a storage_key; S3 holds the file; the CDN\n"
         "   serves it. This keeps the Postgres working set in RAM and keeps restores measured in minutes.\n\n"
         "4  Content is versioned; demand is immutable. content_revision keeps a full JSONB snapshot per publish.\n"
         "   lead and application rows are never edited in place — status transitions append to audit_log, which is\n"
         "   how you answer 'who touched this enquiry, and when' during a commission dispute.\n\n"
         "5  Derived stores are disposable. OpenSearch, Redis and ClickHouse can all be dropped and rebuilt from\n"
         "   Postgres. Nothing is stored only in them. That rule is what keeps one backup and one restore drill.\n\n"
         "6  Indexes come from the actual query shapes, not from habit:\n"
         "   GiST on category.path (subtree reads) and on installation.geo (radius search)\n"
         "   GIN on product.specs (containment), search_tsv (full text), news_post.tags (array overlap)\n"
         "   BRIN on created_at / published_at — append-only time columns, ~1000x smaller than a B-tree\n"
         "   PARTIAL on outbox WHERE published_at IS NULL — the only genuinely hot scan in the system",
         "white", fs_t=18, fs_b=12.5, align="left", vtop=True)
cur += max(c4, hK) + 70

# =========================================================== REGION C
cur = h2(cur, "4 · Why PostgreSQL — and explicitly why not the alternatives",
         "A database choice is only defensible next to the options it beat. "
         "Decision record: ADR-0001, revisit trigger = p95 primary CPU > 60% for 7 days.")

hpg = box(0, cur, 1180, 100,
          "PostgreSQL — chosen",
          "The shape of the domain fits it.\n"
          "   Roughly 90% of this system is relational with hard integrity rules; the remaining 10% (spec sheets,\n"
          "   page blocks, UTM payloads, ATS answers) is document-shaped. Postgres is the only mainstream engine\n"
          "   that is genuinely first class at both. JSONB + GIN gives you MongoDB's flexibility without giving up\n"
          "   joins, foreign keys or transactions — so the flexibility argument for Mongo simply disappears.\n\n"
          "The one thing that must not break is transactional.\n"
          "   A dropped enquiry is lost revenue. lead + lead_item + outbox must commit or fail as a unit. ACID gives\n"
          "   that in a single statement, with no distributed-transaction machinery and no dual-write race.\n\n"
          "It absorbs the next three roadmap features without introducing a new datastore:\n"
          "   full-text search      -> tsvector + pg_trgm, good to ~10^5 docs, so OpenSearch is deferred not required\n"
          "   dealer / install map  -> PostGIS radius and nearest-neighbour queries\n"
          "   'similar products', AI -> pgvector embeddings alongside the row they describe\n"
          "   cabinet IoT telemetry -> TimescaleDB hypertables in the same instance\n"
          "   One engine to operate, back up, monitor, tune and hire for. That is the real cost saving.\n\n"
          "Read scaling here is boring and proven.\n"
          "   Streaming read replicas + PgBouncer absorb a 100x read spike, and 95% of reads never reach the\n"
          "   database because the CDN already answered. Writes are in the hundreds per day — a single primary is\n"
          "   the correct answer for years, and saying so is part of the design, not an omission.\n\n"
          "Change data capture is native.\n"
          "   Logical decoding + Debezium turns every commit into an event for search, cache purge and the\n"
          "   warehouse. Combined with the outbox table this removes the dual-write bug class entirely.\n\n"
          "It is cheap, portable, and hard to get locked into.\n"
          "   RDS, Aurora, Cloud SQL, Neon, Supabase or a plain VM — same SQL, same dump. The exit cost is a\n"
          "   pg_dump, which is exactly the property you want in a vendor decision you cannot yet justify revisiting.\n\n"
          "Limits we accept, with the mitigation written down:\n"
          "   single writer (fine at this write volume) · vacuum and bloat need monitoring · connection cost needs\n"
          "   PgBouncer · major-version upgrades need a rehearsed blue/green drill. All standard, all in the runbook.",
          "pick", fs_t=20, fs_b=12.5, align="left", vtop=True)

rej = [
    ("MongoDB — rejected",
     "The catalogue is a graph with integrity rules, not a pile of documents. Orphaned variants and dangling asset "
     "references are the number-one CMS bug class and Mongo cannot express the constraint that prevents them. "
     "$lookup is weak and slow for the faceted admin queries this team runs daily, and multi-document transactions "
     "remain a bolt-on. Its one genuine advantage — schemaless specs — is already covered by JSONB + GIN with joins "
     "left intact. Choosing it here means hand-rolling referential integrity in application code forever.", "reject"),
    ("DynamoDB — rejected",
     "Excellent when every access pattern is known up front and write scale is unbounded. We have neither. "
     "'Products where capacity > 600 L and refrigerant = R290, faceted by industry' is ad-hoc by nature, and the BI "
     "team needs joins. You would pay in GSI sprawl, denormalisation and write-amplification for a workload of tens "
     "of writes per day. Right tool, wrong problem — and no SQL for analytics.", "reject"),
    ("MySQL / Aurora MySQL — viable, not chosen",
     "This would genuinely work; it is not a bad answer. What it costs: GIN-indexed JSON containment, tsvector "
     "ranking, ltree, PostGIS, pgvector, exclusion constraints, and Debezium-grade logical decoding. Every one of "
     "those is already on the roadmap (specs, search, breadcrumbs, dealer map, semantic search, CDC). Pick MySQL "
     "only if the team's existing ops muscle is MySQL — that reason beats this list.", "maybe"),
    ("Firestore / Airtable / Sheets as the backend — rejected",
     "Firestore: weak ad-hoc querying, per-read billing that punishes a crawler walking the catalogue, no SQL for "
     "BI, heavy lock-in. Airtable or Sheets is genuinely tempting at 350 SKUs and will work for a quarter, then "
     "deliver no transactions, no referential integrity, hard API rate limits and no migration path. "
     "Supabase is fine — but it *is* Postgres, so that is a hosting decision, not a database decision.", "reject"),
    ("Elasticsearch / OpenSearch as the primary store — rejected",
     "No transactions, no foreign keys, painful and lossy on mapping changes, and a reindex bug becomes permanent "
     "data loss rather than a cache miss. Its correct role is a derived, disposable index fed by CDC — which is "
     "exactly how it appears in layer 6. The same reasoning excludes Redis-as-database.", "reject"),
    ("Headless SaaS CMS alone (Contentful / Sanity) — partially adopted",
     "Superb editor experience for pages and news, and worth paying for. But product specs, RFQ leads and CV "
     "applications need our own transactional store, real joins and our own retention and erasure controls — and "
     "per-record SaaS pricing across 350 SKUs x N locales is poor value. Chosen middle path: Payload or Strapi "
     "running on OUR Postgres. One schema, one backup, one restore drill, and the editors still get a good CMS.", "maybe"),
]
hR2 = grid(rej, 1220, 1700, cur, 2, gap=20, vgap=20, min_h=200,
           fs_t=16, fs_b=12.5, align="left", vtop=True)
cur += max(hpg, hR2) + 70

# =========================================================== REGION D
cur = h2(cur, "5 · Scaling path — buy the next 10x, not the next 1000x",
         "Each phase is triggered by a metric, never by a calendar date. "
         "Premature distribution is the most expensive mistake available here.")
hD = row([
    ("Phase 0 — today",
     "Hand-written HTML + CSS on a CDN.\nZero servers, effectively zero cost.\n\n"
     "HOLDS: a handful of pages, content\nchanged by a developer in git.\n\n"
     "BREAKS WHEN: a non-developer has to\npublish, or SKUs pass roughly 30, or\nthe same spec appears on 4 pages and\nthey start to disagree with each other.", "white"),
    ("Phase 1 — 0 to 50k MAU  (Q1)",
     "Next.js on Vercel or Cloud Run.\nManaged Postgres, 2 vCPU / 8 GB.\nS3 + CDN. Resend for mail.\nPayload CMS on the SAME Postgres.\nModular monolith, one deploy unit.\n\n"
     "Search = Postgres tsvector.\nQueue = outbox + a cron worker.\nNo Redis, no Kafka, no mesh.\n\n"
     "Roughly INR 15-25k/month. Two\nengineers can run it comfortably.", "pick"),
    ("Phase 2 — 50k to 500k MAU, multi-locale",
     "ADD: 2 read replicas + PgBouncer ·\nRedis · OpenSearch + CDC indexer ·\nSQS + autoscaled workers · image CDN ·\ni18n + hreflang · CRM sync ·\nClickHouse for lead attribution.\n\n"
     "Still ONE codebase; the services in\nlayer 5 stay modules behind interfaces.\n\n"
     "Capacity check: a 40 rps expo spike\nis one replica and a warm cache. The\nwork here is correctness and freshness,\nnot throughput.", "white"),
    ("Phase 3 — >1M MAU / dealer portal / IoT",
     "Extract only the seams that hurt, in\norder: Search, Media, Notification —\nbursty, independently scaled, clean\ncontracts already. Kafka replaces SQS.\n\n"
     "Multi-region: single writer region +\nregional read replicas + regional ISR.\nTimescale for cabinet telemetry,\npgvector for the AI spec assistant.\n\n"
     "TRIGGERS, not dates: p95 primary CPU\n>60%, deploy lead time >1 day, or two\nteams blocked on one repository.", "white"),
], 0, W_ALL, cur, gap=25, min_h=360, fs_t=18, fs_b=12.5, align="left", vtop=True)
cur += hD + 70

# =========================================================== REGION E
cur = h2(cur, "6 · Capacity, SLOs and the risks worth building against")
hE = row([
    ("Capacity — sized from reality, not vanity",
     "TRAFFIC  A B2B refrigeration brand in India lands around\n"
     "  150-300k pageviews/month  ->  about 0.1 rps average.\n"
     "  Trade-show or campaign peak: 20-40 rps for a couple of hours.\n"
     "  With 95%+ CDN offload the origin sees under 2 rps even at peak.\n"
     "  One small instance and one replica is genuinely enough.\n\n"
     "WRITES  30-80 leads/day, ~10 applications/day, ~20 publishes/week.\n"
     "  Hundreds of writes per day. A single primary is correct.\n\n"
     "STORAGE  350 SKUs x (8 images x 300 KB + 2 PDFs x 3 MB) ~ 8 GB in S3.\n"
     "  Postgres stays under 2 GB, so the entire working set fits in RAM.\n"
     "  No sharding, ever, at this scale. Anyone proposing it is designing\n"
     "  for their promotion packet rather than for this business.\n\n"
     "THE REAL BILL IS EGRESS  Images dominate cost and LCP alike. AVIF plus\n"
     "  exact-width srcset plus immutable long-cache cuts it by roughly 70%,\n"
     "  which is why the image CDN in layer 2 is not a nice-to-have.", "white"),
    ("SLOs and the performance budget",
     "AVAILABILITY   site 99.9%  ·  POST /v1/leads 99.95%\n"
     "               the lead endpoint gets the tighter target because it is\n"
     "               the only revenue-carrying write in the system.\n\n"
     "LATENCY        TTFB p75 < 400 ms   ·   internal API p99 < 300 ms\n\n"
     "WEB VITALS     LCP p75 < 2.0 s  ·  INP < 200 ms  ·  CLS < 0.1\n"
     "               enforced by Lighthouse CI budgets — a regression fails\n"
     "               the build rather than quietly shipping. CWV is a Google\n"
     "               ranking input, so this is an SEO control, not polish.\n\n"
     "DURABILITY     RPO 5 min (WAL ship)  ·  RTO 30 min, drilled quarterly\n"
     "               leads: zero tolerance -> outbox + DLQ + alert on depth > 0\n\n"
     "FRESHNESS      publish -> live p95 < 30 s  ·  index lag p95 < 60 s\n\n"
     "A11Y / SEO     WCAG 2.2 AA with axe clean in CI · schema.org Product,\n"
     "               Organization, BreadcrumbList · sitemap per locale ·\n"
     "               301 map maintained on every information-architecture change\n\n"
     "ERROR BUDGET   0.1%/month ~ 43 min. Budget exhausted -> feature freeze\n"
     "               and the next sprint is reliability work. Not negotiable.", "white"),
    ("Top risks and what we actually build for them",
     "1  SEO REGRESSION ON MIGRATION — the existing URLs are the asset, and a\n"
     "   rebuild is the single most common way to lose organic traffic.\n"
     "   Build: crawl and freeze the current URL inventory, redirect table\n"
     "   loaded into edge KV, pre-launch diff of titles / canonicals /\n"
     "   structured data, staged traffic rollout with rank monitoring.\n\n"
     "2  SILENT LEAD LOSS — invisible and expensive.\n"
     "   Build: synthetic end-to-end lead probe every 5 min, alert on zero\n"
     "   leads in a business hour, DLQ depth alarm, weekly DB-vs-CRM reconcile.\n\n"
     "3  SPAM AND COMPETITOR PRICE SCRAPING.\n"
     "   Build: Turnstile + honeypot + per-IP buckets; dealer pricing behind an\n"
     "   authenticated scope from phase 3 rather than public HTML.\n\n"
     "4  IMAGE BLOAT FROM MARKETING UPLOADS — the usual cause of a slow site.\n"
     "   Build: the Media service enforces max dimensions, generates AVIF/WebP\n"
     "   variants, rejects anything over 8 MB, emits a blurhash placeholder.\n\n"
     "5  SINGLE-WRITER POSTGRES IS A SINGLE POINT OF FAILURE.\n"
     "   Build: multi-AZ with automatic failover, PgBouncer reconnect, and a\n"
     "   read-only degraded mode so the catalogue keeps serving from cache\n"
     "   even while the primary is being replaced.\n\n"
     "6  VENDOR CONCENTRATION (one PaaS + one CDN).\n"
     "   Build: ship as a container and keep the DB plain Postgres, so leaving\n"
     "   is a weekend of work rather than a rewrite.", "white"),
], 0, W_ALL, cur, gap=20, min_h=300, fs_t=18, fs_b=12.5, align="left", vtop=True)
cur += hE + 50

# legend
text(0, cur, wrap("Legend:  green = system of record / recommended choice   ·   red = rejected option   ·   "
                  "amber = viable alternative or partial adoption   ·   [seam] = the service boundary to extract "
                  "first when phase 3 arrives   ·   dashed container = logical grouping, not a deployment unit.",
                  W_ALL, 13, False, 0), 13, MUTE, "left", False, 1.4, W_ALL)

# =========================================================== EMIT
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out")
if len(sys.argv) > 1:
    OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
n = to_excalidraw(os.path.join(OUT, "ss-refrigeration-hld.excalidraw"))
w, h = to_svg(os.path.join(OUT, "ss-refrigeration-hld.svg"))
print("elements: %d" % n)
print("svg canvas: %.0f x %.0f" % (w, h))
