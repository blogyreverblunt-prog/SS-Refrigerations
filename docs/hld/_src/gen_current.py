# -*- coding: utf-8 -*-
"""As-built architecture, production, 2026-10-12.

This canvas draws ONLY what is deployed and verified. Every box corresponds to a
file, a route, a provider or a setting that exists right now. Nothing here is a
plan.

That is the whole point of it. HLD.md draws the target and HLD-FREE-TIER.md draws
the free-tier Phase 1 design; both legitimately contain components that are not
built. Reading either one as a picture of the running system is how a reviewer
concludes that the lead path is protected by Turnstile, the outbox is drained by
QStash and media is served from R2. None of those three is true today.

Facts verified against the live deployment on 2026-10-12:
  - vercel build output        22 routes, 5 prerendered product pages
  - GET  /api/health           every capability false except the database
  - POST /api/leads            400 captcha_failed
  - GET  /sitemap.xml          production origin, not localhost
  - v9/projects API            defaultRegion iad1, nodeVersion 22.x
  - v13/deployments API        two crons registered
  - browser-check              18 route/viewport pairs, 0 errors, 0 cookies
  - git ls-remote origin       no refs -- the repository is empty
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_core import (OPS, PAL, INK, SUB, MUTE, rect, text, arrow, box, row,
                      grid, wrap, tblock_h, to_excalidraw, to_svg)

GUT, CX, CW = 190, 210, 2190
BW = CX + CW                       # 2400
W_ALL = BW


def h1(y, t, sub=None):
    text(0, y, wrap(t, W_ALL, 34, False, 0), 34, INK, "left", False, 1.18, W_ALL)
    y += 34 * 1.18 + 8
    if sub:
        ls = wrap(sub, W_ALL, 15, False, 0)
        text(0, y, ls, 15, MUTE, "left", False, 1.4, W_ALL)
        y += len(ls) * 15 * 1.4
    return y + 24


def h2(y, t, sub=None, w=W_ALL):
    text(0, y, wrap(t, w, 24, False, 0), 24, INK, "left", False, 1.2, w)
    y += 24 * 1.2 + 6
    if sub:
        ls = wrap(sub, w, 14, False, 0)
        text(0, y, ls, 14, MUTE, "left", False, 1.4, w)
        y += len(ls) * 14 * 1.4
    return y + 20


def band(y, label, specs, cols=None, tone="plat", **kw):
    bg = rect(0, y, BW, 10, PAL["band"][0], PAL["band"][1], sw=1.5, r=14, dash="dashed")
    lab = wrap(label, GUT, 15, False, 10)
    text(18, y + 20, lab, 15, PAL[tone][1], "left", False, 1.25, GUT - 24)
    iy = y + 22
    h = grid(specs, CX, CW, iy, cols, **kw) if cols else row(specs, CX, CW, iy, **kw)
    bg["h"] = max(h + 44, len(lab) * 15 * 1.25 + 40)
    return y + bg["h"]


# ============================================================ TITLE
cur = 0
cur = h1(cur,
         "As-Built  ·  Production  ·  2026-10-12",
         "KALT / SS Commercial Refrigeration.   https://ss-refrigeration.vercel.app   —   live and public.\n"
         "This canvas draws only what is deployed. The Phase 1 roadmap — R2, QStash, WhatsApp, the admin — is "
         "ss-refrigeration-free-tier, which by design contains components that do not exist yet; this one does not. "
         "The Phase 2-3 target canvas (Kafka, OpenSearch, multi-AZ) was deleted on 2026-10-12: its triggers have not "
         "fired and the picture was being read as the plan. HLD.md keeps the reasoning.\n"
         "Open faults and their fixes: docs/ops/REMEDIATION-PLAN.md")

# ---- the headline: what is broken
hF = box(0, cur, W_ALL, 92,
         "THE SITE RENDERS CORRECTLY AND CAPTURES NOTHING.  Lead capture is the only revenue path, and it is closed.",
         "POST /api/leads returns 400 captcha_failed on every request. lib/adapters/captcha.ts fails closed in production, "
         "which is correct on its own — but no Turnstile widget exists in any component, so no request can carry a token. "
         "Setting TURNSTILE_SECRET_KEY does not fix it; that only changes the error to \"Missing verification token\".\n"
         "Everything that builds, renders and deploys is green. 22 routes, 18 passing browser checks, no console error, no "
         "failed request. Every one of those checks tested rendering. None submitted the form.",
         "reject", fs_t=19, fs_b=13, align="left", vtop=True)
cur += hF + 50

# ============================================================ REQUEST PATHS
cur = h2(cur, "1 — The two request paths, as they behave today",
         "Read path is healthy and entirely static. Write path stops at the second hop.")

FW = (W_ALL - 5 * 18) / 6.0
fy = cur

# read path
box(0, fy, FW, 96, "Visitor", "Browser\nIndia / global", "client", fs_t=15, fs_b=12)
box(FW + 18, fy, FW, 96, "Vercel CDN", "Static HTML + JS\nglobal edge", "edge", fs_t=15, fs_b=12)
box(2 * (FW + 18), fy, FW, 96, "Prerendered page", "22 routes\nrevalidate = false", "web", fs_t=15, fs_b=12)
box(3 * (FW + 18), fy, FW, 96, "200 OK", "No origin hop\nNo DB query", "pick", fs_t=15, fs_b=12)
arrow(FW + 4, fy + 48, FW + 14, fy + 48)
arrow(2 * FW + 22, fy + 48, 2 * FW + 32, fy + 48)
arrow(3 * FW + 40, fy + 48, 3 * FW + 50, fy + 48)
text(4 * (FW + 18), fy + 24, wrap("READ PATH — works. The CDN answers from a file built at deploy time. "
                                  "No function runs and the database stays asleep.", FW * 2 + 18, 13, False, 0),
     13, SUB, "left", False, 1.35, FW * 2 + 18)
fy += 96 + 22

# write path
box(0, fy, FW, 96, "Visitor", "Submits the\nenquiry form", "client", fs_t=15, fs_b=12)
box(FW + 18, fy, FW, 96, "POST /api/leads", "Function, iad1\nforce-dynamic", "svc", fs_t=15, fs_b=12)
box(2 * (FW + 18), fy, FW, 96, "captcha.verify()", "FAILS CLOSED\nno widget sends a token", "reject", fs_t=15, fs_b=12)
box(3 * (FW + 18), fy, FW, 96, "400", "captcha_failed\nnothing is written", "reject", fs_t=15, fs_b=12)
arrow(FW + 4, fy + 48, FW + 14, fy + 48)
arrow(2 * FW + 22, fy + 48, 2 * FW + 32, fy + 48)
arrow(3 * FW + 40, fy + 48, 3 * FW + 50, fy + 48, stroke=PAL["reject"][1])
text(4 * (FW + 18), fy + 14, wrap("WRITE PATH — blocked. The gate sits BEFORE the transaction, so the outbox never "
                                  "gets the chance to protect the lead. Honeypot and per-IP rate limit are built and "
                                  "working; they run before the captcha and are not the problem.",
                                  FW * 2 + 18, 13, False, 0),
     13, PAL["reject"][1], "left", False, 1.35, FW * 2 + 18)
cur = fy + 96 + 50

# ============================================================ HOST
cur = h2(cur, "2 — Host and edge", "Vercel project ss-refrigeration, team managekalt-5790, Hobby plan.")
cur = band(cur, "HOST", [
    ("Vercel  ·  Hobby",
     "Project  ss-refrigeration\nTeam  managekalt-5790\nPlan  Hobby\n\nHobby forbids commercial\nuse. This is a live breach,\nnot a future one.", "reject"),
    ("Functions  ·  iad1",
     "Washington DC, US East\nNode 22.x  ·  nodejs runtime\nmaxDuration 60 s (cron)\n\nNeon is in Singapore.\nEvery query crosses the\nPacific. ~220 ms RTT.", "maybe"),
    ("Edge CDN",
     "Static HTML + assets\nglobal PoPs\n\nImages served unoptimised\nfrom public/ — no R2, no\nimage loader (not built).", "edge"),
    ("Access",
     "Production domain  PUBLIC\nss-refrigeration.vercel.app\n\nPreview + deployment URLs\nsit behind Vercel auth.\nVerified by request.", "plat"),
    ("Response headers",
     "HSTS 2 y + preload\nX-Content-Type-Options\nReferrer-Policy\nX-Frame-Options DENY\nPermissions-Policy\n\nNo CSP — needs nonces.", "pick"),
], cols=5, tone="edge", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=186)
cur += 36

# ============================================================ RENDER
cur = h2(cur, "3 — Render surface",
         "22 routes. Every page sets revalidate = false, so nothing regenerates on a timer and the database "
         "sleeps between deploys. This is HLD-FREE-TIER §4.1 enforced, and it is the decision that keeps the "
         "Neon compute budget intact.")
cur = band(cur, "STATIC\nSSG", [
    ("Marketing  ·  6",
     "/           home\n/about\n/industries\n/compare\n/privacy\n/terms", "web"),
    ("Catalogue  ·  7",
     "/products\n/products/[slug]  ×5\n  reach-in-refrigerator\n  undercounter-refrigerator\n  sushi-display-case\n  + 2 more\n\ndynamicParams = true", "web"),
    ("Lead surfaces  ·  2",
     "/contact\n/support\n\nBoth POST to /api/leads.\nBoth are currently\nrejected. See §1.", "reject"),
    ("Resources  ·  1",
     "/downloads\n\nSpec sheets and CAD\ndrawings are NOT UPLOADED\nYET — the page renders the\nplaceholder state.", "maybe"),
    ("Generated  ·  6",
     "/sitemap.xml\n/robots.txt\n/icon.svg\n/opengraph-image\n/_not-found\n\nOrigin read from APP_URL\nat build. Verified correct.", "plat"),
], cols=5, tone="web", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=186)
cur += 36

# ============================================================ FUNCTIONS
cur = h2(cur, "4 — Server functions", "Six route handlers, all force-dynamic, all nodejs runtime.")
cur = band(cur, "FUNCTIONS", [
    ("POST /api/leads",
     "THE ONLY REVENUE WRITE\n\nhoneypot -> rate limit ->\ncaptcha -> idempotency ->\ntxn(lead + item + outbox)\n\nBLOCKED AT CAPTCHA", "reject"),
    ("GET /api/cron/[job]",
     "Bearer CRON_SECRET\nmaxDuration 60\n\nmaintenance | guardrails\noutbox-sweep\n\n401 without the secret —\nverified by request.", "pick"),
    ("POST /api/jobs/[task]",
     "QStash delivery target\nSignature-verified\n\nQSTASH keys are unset, so\nnothing ever calls this.", "ext"),
    ("POST /api/revalidate",
     "Bearer REVALIDATE_SECRET\n\nPublish webhook ->\nrevalidateTag. Secret is\nset; no publisher exists\nto call it yet.", "maybe"),
    ("GET /api/catalog",
     "Read API over the\ncatalogue module.\nBuilt and serving.", "pick"),
    ("GET /api/health",
     "Capability report.\n\nReturns every integration\nflag. This is how the\nunconfigured adapters were\nfound.", "pick"),
], cols=6, tone="svc", fs_t=14.5, fs_b=11.5, align="left", vtop=True, min_h=176)
cur += 36

# ============================================================ MODULES + LIB
cur = h2(cur, "5 — Modules and adapters",
         "src/modules/* are the seams; each exposes only index.ts and an ESLint rule enforces it. "
         "src/lib/container.ts is the composition root — it reads the capability flags in env.ts and wires a real "
         "adapter or deregisters the channel. That is why a missing token degrades one feature instead of "
         "breaking the lead path.")
cur = band(cur, "MODULES", [
    ("catalog", "Products, variants,\nspecs. Feeds SSG.", "web"),
    ("leads", "Enquiry service. Correct\n— the adapter blocks it.", "web"),
    ("outbox", "Transactional outbox\n+ sweeper.", "web"),
    ("notify", "Channel registry.\nNo channel is live.", "reject"),
    ("content", "Structured content.\nNo publisher UI.", "ext"),
    ("media", "Upload + derive.\nNo bucket configured.", "ext"),
    ("search", "tsvector. Not wired\nto a UI yet.", "ext"),
], cols=7, tone="svc", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=104)
cur += 14

cur = band(cur, "ADAPTERS\nlib/", [
    ("db.ts  ->  Neon",
     "CONFIGURED\nPooled driver. The only\nintegration that is live.", "pick"),
    ("adapters/captcha.ts",
     "Turnstile\nNOT CONFIGURED — and\nfails closed, so it blocks\nevery lead. See §1.", "reject"),
    ("adapters/mail.ts",
     "Resend\nNOT CONFIGURED\nNo lead reaches a human.", "reject"),
    ("adapters/queue.ts",
     "QStash\nNOT CONFIGURED\nOutbox has no fast drain.", "maybe"),
    ("adapters/cache.ts",
     "Upstash Redis\nNOT CONFIGURED\nRate limiting degrades.", "maybe"),
    ("adapters/storage.ts",
     "Cloudflare R2\nNOT CONFIGURED\nUploads are refused.", "maybe"),
], cols=6, tone="gw", fs_t=14.5, fs_b=11.5, align="left", vtop=True, min_h=116)
cur += 36

# ============================================================ DATA
cur = h2(cur, "6 — Data and the async backbone")
cur = band(cur, "DATA", [
    ("Neon PostgreSQL",
     "ap-southeast-1  (Singapore)\nPooled connection string\n3 migrations applied\n\nRead at BUILD time by\ngenerateStaticParams — so a\ndeploy needs a reachable,\nmigrated database.", "data"),
    ("Tables in use",
     "product\nproduct_variant\nlead\nlead_item\noutbox\n\n5 live products prerendered\nat the last deploy.", "data"),
    ("Outbox  ·  intact",
     "The lead row and the event\nrow commit in ONE\ntransaction. That guarantee\nis built and correct.\n\nIt is simply never reached,\nbecause the captcha gate\nrejects the request first.", "maybe"),
    ("Drain  ·  degraded",
     "QStash schedule: NOT BUILT\nNightly forced sweep: BUILT\n\nSo an event waits up to 24 h\ninstead of 15 min — and then\nfinds no notification channel\nconfigured, so it cannot be\npublished at all.", "reject"),
    ("Backup  ·  NONE",
     "HLD-FREE-TIER §4.3 calls the\nnightly pg_dump to R2 \"the\nsingle most important cron\njob in the system\".\n\nIt is not built. No R2 bucket\nexists. Neon Free keeps a\n6 h history window and takes\nno scheduled backup.", "reject"),
], cols=5, tone="data", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=196)
cur += 36

# ============================================================ SCHEDULE + CI
cur = h2(cur, "7 — Schedulers and delivery")
cur = band(cur, "CRON", [
    ("Vercel Cron  ·  maintenance",
     "0 3 * * *    daily\nPrune published outbox rows,\nforced sweep.\nREGISTERED — verified on the\ndeployment record.", "pick"),
    ("Vercel Cron  ·  guardrails",
     "30 3 * * *   daily\nLead count, outbox backlog,\nstuck events -> notifier.\nREGISTERED.\n\nThe alarm fires into a\nnotifier with no channel.", "maybe"),
    ("Hobby cron limits",
     "Once per day maximum.\n±59 min of slop.\n\nA sub-daily expression fails\nat deploy time, which is why\nthe 15-minute sweeper cannot\nlive here.", "ext"),
    ("Synthetic lead probe",
     "NOT BUILT.\n\nHLD §11 risk 2 and\nHLD-FREE-TIER §3.3 both\nspecify it. It is the one\ncontrol that would have\ncaught the §1 fault before a\nvisitor did.", "reject"),
], cols=4, tone="async", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=176)
cur += 14

cur = band(cur, "CI / CD", [
    ("GitHub Actions  ·  written",
     ".github/workflows/\n  deploy-production.yml\n  deploy-preview.yml\n\ntypecheck + lint  ->\nvercel build  ->\nvercel deploy --prebuilt", "web"),
    ("NOT ACTIVE",
     "git ls-remote origin returns\nNO REFS. The repository is\nempty.\n\nThe deployed code exists only\nin an uncommitted local\nworking tree.", "reject"),
    ("vercel.json",
     "git.deploymentEnabled false\n— otherwise Vercel's own Git\nintegration deploys the same\ncommit a second time.\n\n2 cron definitions.", "pick"),
    ("Windows trap",
     "vercel build symlinks\nduplicate functions and on\nWindows writes the target\nwith BACKSLASHES.\n\n--prebuilt from Windows ->\nENOENT on the Linux builder.\nCI is Linux and is fine.", "maybe"),
    ("Secrets needed",
     "VERCEL_TOKEN\nVERCEL_ORG_ID\nVERCEL_PROJECT_ID\n\nThe two ids are the orgId\nand projectId in\n.vercel/project.json after\n`vercel link`. That file is\ngitignored, and the ids are\nnot repeated here.", "plat"),
], cols=5, tone="web", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=176)
cur += 36

# ============================================================ ENV
cur = h2(cur, "8 — Environment contract, as set",
         "Six variables are set on Production and Preview. src/lib/env.ts is the only file that reads process.env; "
         "an ESLint rule makes every other read a build error.")
cur = band(cur, "ENV", [
    ("SET  ·  6", "DATABASE_URL\nAPP_URL\nLEAD_IP_HASH_SALT\nCRON_SECRET\nREVALIDATE_SECRET\nMAIL_FROM", "pick"),
    ("APP_URL  ·  the trap",
     "Defaults to localhost:3000.\nThe build ACCEPTS that and\nbakes it into sitemap, robots\nand every canonical URL.\n\nSet correctly here before the\nfirst build. Verified in the\nlive output.", "maybe"),
    ("EMPTY  ·  integrations",
     "RESEND_API_KEY  SALES_INBOX\nTURNSTILE_SECRET_KEY\nQSTASH_*  ·  UPSTASH_REDIS_*\nR2_*  ·  TELEGRAM_*\nWHATSAPP_*  ·  DATABASE_URL_RO\nNEXT_PUBLIC_ANALYTICS_*", "ext"),
    ("NEVER SET IN PROD",
     "SKIP_ENV_VALIDATION\n  boots the app on a stub DB\nNODE_ENV\n  Vercel sets it\n\nBoth deliberately omitted.", "reject"),
    ("Missing from the contract",
     "NEXT_PUBLIC_TURNSTILE_SITE_KEY\n\nThe browser half of the bot\ndefence needs it, and env.ts\nhas no such key — which is the\nstructural reason §1 exists.", "reject"),
], cols=5, tone="plat", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=176)
cur += 36

# ============================================================ VERIFIED
cur = h2(cur, "9 — What was verified, and how")
cur = band(cur, "EVIDENCE", [
    ("Headless Chrome",
     "18 route/viewport pairs,\ndesktop 1360 and phone 390.\nStylesheet ATTACHED and its\ntoken resolving. No console\nerror. No failed request.\nNo horizontal overflow.", "pick"),
    ("Privacy posture",
     "0 cookies set.\n0 third-party origins.\n\nSo the no-consent-banner\ndecision still holds. Adding\nGA4 would end that.", "pick"),
    ("SEO origin",
     "sitemap.xml and robots.txt\nboth emit the production\ndomain, not localhost.\nChecked by request.", "pick"),
    ("Lead path",
     "POST with a valid body ->\n400 captcha_failed.\n\nThe captcha runs BEFORE\npersist(), so the probe wrote\nno row.", "reject"),
    ("Content state",
     "TEMPLATE badges are live and\npublic: phone renders as\n+91 00000 00000, plus a\nplaceholder GSTIN and one\ntestimonial.\n\nsrc/content/site.ts\nisTemplate = true", "maybe"),
], cols=5, tone="pick", fs_t=15, fs_b=11.5, align="left", vtop=True, min_h=176)
cur += 44

# ============================================================ OMITTED
hOm = box(0, cur, W_ALL, 80,
          "DELIBERATELY NOT DRAWN — every component below appears in the other two canvases and does not exist in this build.",
          "R2 bucket and the AVIF derive pipeline  ·  lib/image-loader.ts  ·  QStash queue and the 15-minute sweeper schedule  ·  "
          "Upstash Redis  ·  WhatsApp Cloud API and the WhatsApp-first call to action  ·  Resend  ·  Telegram  ·  Turnstile widget  ·  "
          "synthetic lead probe  ·  nightly pg_dump  ·  /admin and Auth.js  ·  careers, news, installations  ·  search UI  ·  "
          "Debezium, Kafka, OpenSearch, read replica, PgBouncer, multi-AZ.\n"
          "They are not errors in those documents — they are the plan. They are omitted here so that this canvas can be trusted "
          "as a description of the running system. Status table: HLD-FREE-TIER.md §0a.",
          "ext", fs_t=15, fs_b=12.5, align="left", vtop=True)
cur += hOm + 30

text(0, cur, wrap("Legend:  green = built, configured and verified  ·  amber = built but degraded, or a limit worth watching  ·  "
                  "red = broken, missing, or non-compliant  ·  grey = present in code but unconfigured, so inert  ·  "
                  "teal = built and serving (render tier, modules)  ·  blue = the visitor  ·  yellow-edge = host and CDN.   "
                  "Every claim on this canvas was checked against the live deployment on 2026-10-12 — see the docstring in "
                  "_src/gen_current.py for the exact commands.   Faults and fixes: docs/ops/REMEDIATION-PLAN.md",
                  W_ALL, 13, False, 0), 13, MUTE, "left", False, 1.4, W_ALL)

# ============================================================ EMIT
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
n = to_excalidraw(os.path.join(OUT, "ss-refrigeration-current.excalidraw"))
w, h = to_svg(os.path.join(OUT, "ss-refrigeration-current.svg"))
print("elements: %d" % n)
print("svg canvas: %.0f x %.0f" % (w, h))
