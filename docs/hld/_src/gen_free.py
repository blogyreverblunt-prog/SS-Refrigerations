# -*- coding: utf-8 -*-
"""Phase 1 site feature architecture, free-tier build.

Content is driven by docs/ia/SITE-SECTIONS-REPORT.md -- the five-site competitive
audit. Every page, block and facet below traces to a numbered section of that
report. The infrastructure numbers carry over from the previous revision and were
verified against each provider's own pricing page on 2026-10-07.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_core import (OPS, PAL, INK, SUB, MUTE, rect, text, arrow, box, row,
                      grid, wrap, tblock_h, to_excalidraw, to_svg)

GUT, CX, CW = 190, 210, 2190
BW = CX + CW                       # 2400
RAIL_X, RAIL_W = 2460, 460
W_ALL = RAIL_X + RAIL_W            # 2920
GAP = 56


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


def gauge(x, y, w, name, used, total, unit, pct, note):
    """A quota meter: label, track, fill, and the number."""
    tone = "pick" if pct < 70 else ("maybe" if pct < 85 else "reject")
    h = 112
    rect(x, y, w, h, PAL[tone][0], PAL[tone][1], sw=2, r=10)
    text(x + 14, y + 13, wrap(name, w - 28, 14, False, 0), 14, INK, "left", False, 1.2, w - 28)
    text(x + 14, y + 35, ["%s / %s %s" % (used, total, unit)], 16, INK, "left", True, 1.2, w - 28)
    mx, my, mw = x + 14, y + 62, w - 28
    rect(mx, my, mw, 12, "#ffffff", "#adb5bd", sw=1.5, r=6)
    rect(mx, my, max(6.0, mw * min(pct, 100) / 100.0), 12, PAL[tone][1], PAL[tone][1], sw=1.5, r=6)
    text(x + 14, y + 82, wrap("%d%%  ·  %s" % (pct, note), w - 28, 11.5, False, 0),
         11.5, SUB, "left", False, 1.25, w - 28)
    return h


# ============================================================ TITLE
cur = 0
cur = h1(cur,
         "Phase 1 — Site Feature Architecture  ·  Free-Tier Build",
         "KALT / SS Commercial Refrigeration.   Feature set derived from docs/ia/SITE-SECTIONS-REPORT.md — "
         "the five-site audit of westernequipments.com, truemfg.com, beverage-air.com, traulsen.com and "
         "bluestarindia.com.   Product taxonomy anchored to the Hoshizaki refrigeration catalogue.\n"
         "Rev 2.0   2026-10-08   ·   Supersedes Rev 1.0, which described the same $0 topology without the "
         "feature map.   Data model (HLD.md §7) and ADR-0001 'why PostgreSQL' (§8) carry over unchanged.")

# ---- the one principle
hP = box(0, cur, W_ALL, 92,
         "THE ONE PRINCIPLE — every page funnels to a single action: AN ENQUIRY.  There is no checkout.",
         "Not one of the five audited sites publishes a price. Every path through every one of them terminates in "
         "\"request a quote\", \"find a dealer\" or \"contact us\". That makes the enquiry the only conversion event "
         "on the site, and it is the only write path that carries revenue — so it gets the outbox, the retries and the "
         "synthetic probe (§6), while everything else is a static file served from a CDN edge.\n"
         "Read every box below as: what does this page need in order to produce an enquiry, and what does it cost to serve.",
         "note", fs_t=19, fs_b=13, align="left", vtop=True)
cur += hP + 22

# ---- hosting blocker, compact: still true, no longer the headline
hB = box(0, cur, W_ALL, 60,
         "Hosting constraint, unchanged from Rev 1.0 — Vercel Hobby forbids commercial use.  Design on it, do not launch on it.",
         "Vercel Fair Use Guidelines, verbatim: \"Hobby teams are restricted to non-commercial personal use only.\"  A client's "
         "B2B lead-generation site is commercial use.   Launch on Vercel Pro ($20/mo, no code change) or Cloudflare Workers "
         "($0, commercially permitted, add @opennextjs/cloudflare — one day, once).  Everything below is host-agnostic Next.js "
         "with no Vercel-proprietary API on a critical path, specifically so that stays a one-day change.",
         "reject", fs_t=15, fs_b=12.5, align="left", vtop=True)
cur += hB + 60

# ============================================================ 1 · PAGE MAP
cur = h2(cur, "1 · The page map — nine must-have pages, plus pricing held back",
         "Every card carries its convergence count from the audit (how many of the five sites have it), its render "
         "strategy, and what it reads or writes. 5/5 is table stakes; a section at 1/5 is one company's pet project.")

pages = [
    ("1 · Home                                              5/5",
     "11 blocks: utility bar · 5-item nav + products mega-menu · ONE static\n"
     "hero (NOT a 5-slide carousel, slides 2+ are not seen) · shop-by-type\n"
     "6-card grid · shop-by-industry rail · why-us NUMBER tiles · CLIENT\n"
     "LOGO STRIP · featured models · service promise · enquiry band · footer\n"
     "RENDER  SSG at build\n"
     "READS   MDX + 6 category rows", "web"),
    ("2 · Products hub                                       5/5",
     "6 category cards mapped 1:1 to the Hoshizaki range (§2) · a second row\n"
     "for adjacent lines you carry · filter entry point · one big\n"
     "\"Download full catalogue (PDF)\" — what distributors actually want.\n"
     "A flat list of 300 model codes is unusable; all five use a grid.\n"
     "RENDER  SSG\n"
     "READS   categories + model counts", "web"),
    ("3 · Product category  × 6                              5/5",
     "Hero copy (concrete, not corporate) · sub-type blocks · model grid ·\n"
     "filter sidebar (§4) · COMPARISON TABLE — none of the five do this\n"
     "well, so it is the easiest place to beat them · related industries ·\n"
     "\"not sure which model?\" → enquiry with the category pre-filled\n"
     "RENDER  ISR, on-demand revalidation only\n"
     "READS   catalog", "web"),
    ("4 · Product detail  × N        ← 60% OF THE EFFORT     5/5",
     "THE page. Organic search lands here, not on the home page. Three\n"
     "different people use it: the chef, the kitchen consultant and the\n"
     "purchase manager — and each needs something different.\n"
     "13 content blocks, specified in §3.\n"
     "RENDER  ISR, on-demand revalidation\n"
     "READS   catalog + specs + media + documents", "pick"),
    ("5 · Industries                                         3/5",
     "ONE page, six ANCHORED sections — not six thin pages:\n"
     "Restaurants, QSR & cloud kitchens · Bakery, patisserie &\n"
     "confectionery · Supermarket & retail · Hotels, banqueting &\n"
     "institutional · Healthcare & pharma · Ice cream, dairy & beverage\n"
     "Buyers self-identify by business type, not by equipment category.\n"
     "RENDER  SSG      READS  MDX + product industry tags", "web"),
    ("6 · About Us                                           5/5",
     "ONE page, not the six the audited sites fragment it into:\n"
     "who we are · NUMBERS not adjectives · manufacturing & plant photos ·\n"
     "CERTIFICATIONS, ISO/BIS/CE — frequently the deciding document in an\n"
     "Indian tender · R&D · sustainability · Hoshizaki association\n"
     "RENDER  SSG\n"
     "READS   MDX", "web"),
    ("7 · Service & Support                                  5/5",
     "ONE page. Do NOT copy True's ~25-URL support tree — that exists\n"
     "because they have decades of installed base, and you have none yet.\n"
     "Helpline FIRST · installation · AMC · genuine spares · warranty\n"
     "table · service CITY LIST · service request form · FAQ\n"
     "RENDER  SSG + form POST\n"
     "READS   MDX + faq rows", "web"),
    ("8 · Contact & Enquiry      ← THE CONVERSION EVENT      5/5",
     "Every other page on the site is a funnel into this form.\n"
     "9 fields MAX · enquiry-type dropdown · model pre-filled from the\n"
     "product page · phone + WhatsApp beside the form, because a large\n"
     "share of Indian B2B buyers will not fill a form · offices + GSTIN ·\n"
     "separate dealership form\n"
     "WRITES  lead + lead_item[] + outbox, in ONE txn.  See §6.", "pick"),
    ("9 · Downloads                                          3/5",
     "Catalogue PDF · spec sheets · manuals · brochures · certificates ·\n"
     "CAD/Revit. A filtered list over ONE table — the best effort-to-value\n"
     "ratio on the whole site. Western has none, and it is a visible\n"
     "weakness in the closest comparable site. Do NOT gate the spec sheets.\n"
     "RENDER  ISR\n"
     "READS   documents → R2 public or signed URLs", "web"),
    ("10 · PRICING          ← DEFERRED, PRE-CUT ONLY         0/5",
     "v1 ships no price, because 0 of 5 audited sites publish one.\n"
     "You asked to define this later — §4 cuts the seam now so that\n"
     "switching it on is a template change, not a migration.\n"
     "The decision to make first: indicative, list, or dealer-only.\n"
     "RENDER  n/a in v1\n"
     "READS   model.price_* columns, all NULL at launch", "maybe"),
    ("11 · Privacy · Terms                                   5/5",
     "Thin, footer-linked. Must carry the \"specifications subject to\n"
     "change without notice\" clause — all five audited sites have it —\n"
     "plus a product-image disclaimer, an IP notice, and an India\n"
     "e-waste handling note as Blue Star carries.\n"
     "RENDER  SSG from MDX\n"
     "READS   nothing", "plat"),
    ("12 · sitemap · robots · schema.org                     —",
     "Not a page anyone visits, and non-negotiable: this is HOW the\n"
     "catalogue gets found at all. sitemap.xml + robots.txt are BUILT and\n"
     "live, generated statically from APP_URL · schema.org Product +\n"
     "Organization + BreadcrumbList on every model page.\n"
     "RENDER  generated at build (no cron — a deploy is the refresh)\n"
     "READS   catalog", "plat"),
]
hPM = grid(pages, 0, W_ALL, cur, 4, gap=20, vgap=18, min_h=168,
           fs_t=15, fs_b=11.5, mono_body=True, align="left", vtop=True)
cur += hPM + 24

hNav = box(0, cur, W_ALL, 60,
           "Navigation — five primary items, everything within two clicks",
           "Home   |   Products  (mega-menu: the 6 Hoshizaki categories, + Ice Machines if carried)   |   Industries   |   "
           "Service & Support   |   Downloads   |   About Us   |   Contact\n"
           "Footer: Privacy · Terms · Careers · Sitemap · Social          Persistent: [Get a Quote] · phone · WhatsApp\n"
           "The five audited sites run between five and nine primary items. The ones at nine are harder to use, not richer.",
           "white", fs_t=16, fs_b=12.5, mono_body=True, align="left", vtop=True)
cur += hNav + 60

# ============================================================ 2 · TAXONOMY
cur = h2(cur, "2 · Product taxonomy — mapped 1:1 to the Hoshizaki refrigeration catalogue",
         "Six categories, each tracing to a named Hoshizaki product family, so the catalogue stays honest about what "
         "can actually be supplied.")
cats = [
    ("1 · Reach-In Refrigerators & Freezers",
     "Hoshizaki: Reach-in Refrigerator\nRefrigerator · Freezer · Dual-temp ·\nConvertible. One/two/three section,\nfull or half doors, stainless or glass.", "data"),
    ("2 · Undercounter & Worktop",
     "Hoshizaki: Undercounter Refrigerator\nUndercounter · Worktop · Drawer units ·\nChef base. Refrigerator, freezer and\ndual-temp variants.", "data"),
    ("3 · Glass Door & Visi Coolers",
     "Hoshizaki: Glass Door Refrigerator\nVisi coolers · countertop units ·\nfull-height merchandisers · compact.\nCold storage + merchandising.", "data"),
    ("4 · Display Cases & Showcases",
     "Hoshizaki: Sushi Display Case\nPastry & confectionery cabinets ·\ndeli/sushi cases · curved glass ·\nhigh-humidity constant-temp cases.", "data"),
    ("5 · Deep Freezers",
     "Hoshizaki: Deep Freezer\nHard-top · glass-top · ultra-low to\n-60 degC. Region-limited: Japan, East\n& SE Asia, South Asia. Confirm first.", "data"),
    ("6 · Walk-In Cold Rooms",
     "Hoshizaki: Walk-in Refrigerator\nFreezer · refrigerator · high-humidity.\nMARKED JAPAN-ONLY by Hoshizaki —\nverify availability before publishing.", "maybe"),
]
hC = grid(cats, 0, W_ALL, cur, 6, gap=18, vgap=18, min_h=132,
          fs_t=14.5, fs_b=11.5, align="left", vtop=True)
cur += hC + 20
hC2 = box(0, cur, W_ALL, 60,
          "Scope note — the India range is wider than these six",
          "Western Refrigeration, the Hoshizaki India arm and the closest comparable in the audit, also sells: visi coolers · "
          "pastry and confectionery cabinets · preparation tables · back bars · ice machines · dishwashers · glass washers · "
          "medical refrigerators · water coolers · dispensers · supermarket freezers · vending machines.\n"
          "ICE MACHINES ARE HOSHIZAKI'S FLAGSHIP PRODUCT WORLDWIDE. If they can be carried, they belong in the nav as a seventh "
          "category, not buried under an existing one.",
          "note", fs_t=16, fs_b=12.5, align="left", vtop=True)
cur += hC2 + 60

# ============================================================ 3 · PRODUCT DETAIL
cur = h2(cur, "3 · The product detail page — 13 blocks, modelled on the best of the five",
         "Beverage-Air's model page (CT2HC-1S) is the benchmark: an 11-row spec table and nine downloadable files per model. "
         "Spend 60% of the build effort on this one template.")
blocks = (
    " 1  Image gallery         4-6 photos: closed · open and loaded · interior · controls · in-situ.\n"
    "                          Plus a LINE DRAWING carrying the dimensions.\n"
    " 2  Model code + name     As the H1.   \"HR-78MA-S  ·  Reach-In Refrigerator, Two Section, Solid Door\"\n"
    " 3  At-a-glance block     capacity (litres AND cu ft) · temperature range degC · exterior W x D x H in MM\n"
    "                          · doors/sections · refrigerant · power.  Above the fold.\n"
    " 4  Primary CTAs          [ Request a Quote ]   [ Download Spec Sheet ]   both above the fold.  No price.\n"
    " 5  Cabinet construction  exterior/interior material and GRADE · insulation type and thickness · door type\n"
    "                          and reversibility · lock · shelves (count + finish) · castors · handle\n"
    " 6  Refrigeration system  refrigerant + compliance · compressor type · defrost method · evaporator coating\n"
    "                          · controller · temperature uniformity\n"
    " 7  Specification table   11 rows minimum, + 5 more for India         -> panel, right\n"
    " 8  Downloads block       9 files per model                           -> panel, far right\n"
    " 9  Warranty              Stated ON the page, not buried. True leads with \"7-year parts, labour and\n"
    "                          compressor\" as a headline FEATURE, because it closes deals.\n"
    "10  Accessories           shelves · castors · drawer kits · door locks\n"
    "11  Suitable for          industry tags, linking back to the Industries page\n"
    "12  Related models        3 cards — including the next size UP and the next size DOWN\n"
    "13  Enquiry form          inline at the bottom, model pre-filled.  Writes to §6 step 2."
)
hD = box(0, cur, 1500, 60, "The 13 blocks, in page order", blocks, "white",
         fs_t=17, fs_b=11.5, mono_body=True, align="left", vtop=True)

spec_panel = (
    "THE 11 ROWS BEVERAGE-AIR SHIPS   (CT2HC-1S, verbatim)\n"
    "  model number · exterior dimensions W x D x H · interior\n"
    "  dimensions · exterior construction · interior construction\n"
    "  · doors · shelves · net capacity · hinge location ·\n"
    "  compressor location · door type\n\n"
    "ADD FIVE FOR INDIA\n"
    "  voltage / frequency / phase    230 V 1-ph or 415 V 3-ph, 50 Hz\n"
    "  power consumption              W\n"
    "  ambient / climate class        rated for Indian summer\n"
    "  net and gross weight           kg\n"
    "  energy rating                  star label where applicable\n\n"
    "UNITS: METRIC FIRST. Litres and mm primary, cu ft and inches\n"
    "secondary. This is the single most common localisation failure\n"
    "when copying the structure of a US site."
)
hS1 = box(1540, cur, W_ALL - 1540, 60, "7 · The specification table", spec_panel, "white",
          fs_t=17, fs_b=11.5, mono_body=True, align="left", vtop=True)
dl_panel = (
    "NINE FILES PER MODEL   (what Beverage-Air actually ships)\n"
    "  spec sheet PDF           manual PDF            brochure PDF\n"
    "  warranty statement PDF   product video         Revit / BIM\n"
    "  AutoCAD front .dwg       AutoCAD plan          AutoCAD side\n\n"
    "Four of the nine is already strong. Omitting the spec sheet is\n"
    "the single most common reason a B2B refrigeration enquiry never\n"
    "happens — the purchase manager cannot put a web page in a tender.\n\n"
    "All nine live in Cloudflare R2 and the page links them directly.\n"
    "R2 egress is free at any volume, so the heavy bytes never touch\n"
    "the host's bandwidth quota.  Store per RANGE, not per SKU:\n"
    "~80 PDFs, not 700."
)
hS2 = box(1540, cur + hS1 + 20, W_ALL - 1540, 60, "8 · The downloads block", dl_panel, "white",
          fs_t=17, fs_b=11.5, mono_body=True, align="left", vtop=True)
cur += max(hD, hS1 + 20 + hS2) + 60

# ============================================================ 4 · PRICING
cur = h2(cur, "4 · Pricing — deferred by decision, pre-cut by design",
         "You asked for a price section. The honest position: 0 of the 5 audited sites publish a price, so v1 ships none. "
         "What follows is the seam, cut now, so that turning pricing on later costs a template change rather than a migration.")
price = [
    ("Why v1 ships no price",
     "Western · True · Beverage-Air · Traulsen ·\n"
     "Blue Star\n"
     "   prices published:   0 of 5\n\n"
     "Every path on all five ends in \"request a\n"
     "quote\" or \"find a dealer\".\n\n"
     "A commercial cabinet price is a function of\n"
     "configuration, quantity, dealer margin, GST,\n"
     "freight and installation. Publishing one\n"
     "number invites a dispute you then defend on\n"
     "every single enquiry.", "maybe"),
    ("The three shapes it can take — decide BEFORE building",
     "A  INDICATIVE    \"from Rs 1,25,000 + GST\" per model\n"
     "                 family. Cheapest to run, filters out\n"
     "                 tyre-kickers, costs negotiating room.\n"
     "B  LIST / MRP    full price + \"GST extra, freight extra,\n"
     "                 installation quoted separately\". Needs a\n"
     "                 real price-revision process behind it.\n"
     "C  DEALER-ONLY   visible after login, by dealer tier. Most\n"
     "                 flexible, most to build — needs the user\n"
     "                 accounts v1 deliberately does not have.\n\n"
     "These are not the same schema. A is a string on a family,\n"
     "C is a join table and an auth boundary.", "white"),
    ("The seam — cut it now, costs nothing",
     "ON model:\n"
     "  price_minor        bigint  NULL    paise, never float\n"
     "  currency           char(3) DEFAULT 'INR'\n"
     "  price_visibility   enum('hidden','indicative','list',\n"
     "                          'dealer')  DEFAULT 'hidden'\n"
     "  price_valid_from   date    NULL\n"
     "  tax_note           text    NULL    \"GST extra\"\n\n"
     "ON the template:\n"
     "  one <PriceSlot/> that renders NOTHING while visibility\n"
     "  = 'hidden'. Ships in v1, renders in v2, no redeploy of\n"
     "  the data model.\n\n"
     "ON the enquiry:\n"
     "  lead_item already carries model + quantity (§6 step 2).\n"
     "  That IS the quote request. Nothing to add.", "pick"),
    ("What NOT to build",
     "No cart. No checkout. No payment gateway.\n"
     "No \"build & price\" configurator — the current\n"
     "index.html has that CTA and the report says cut\n"
     "it, because 0 of 5 publish a price to configure\n"
     "against.\n"
     "No per-dealer discount engine in v1.\n\n"
     "A price that is WRONG is worse than no price: it\n"
     "is the one piece of content on a refrigeration\n"
     "site that a customer will quote back at you, six\n"
     "months later, in a negotiation.", "reject"),
]
hPr = grid(price, 0, W_ALL, cur, 4, gap=20, vgap=18, min_h=250,
           fs_t=15.5, fs_b=11.5, mono_body=True, align="left", vtop=True)
cur += hPr + 60

# ============================================================ 5 · FACETS
cur = h2(cur, "5 · Faceted filter specification — one facet set, metric first")
facets = (
    "FACET                   VALUES\n"
    "------------------------------------------------------------------------------------\n"
    "Product type            Refrigerator · Freezer · Dual-temp · Convertible\n"
    "Configuration           Upright/reach-in · Undercounter · Worktop · Drawer ·\n"
    "                        Glass door · Display case · Chest · Walk-in\n"
    "Sections / doors        1 · 2 · 3 · 4+\n"
    "Door type               Solid stainless · Half door · Full glass · Sliding · Drawer\n"
    "Capacity                LITRES (range slider); cu ft shown secondary\n"
    "Temperature range       +2 to +8 degC · -18 to -22 degC · -40 degC · -60 degC · dual\n"
    "Exterior width          MM (range slider)\n"
    "Refrigerant             R290 · R600a · R134a · R404A\n"
    "Finish                  SS 304 · SS 430 · Powder-coated\n"
    "Power                   230 V single phase · 415 V three phase\n"
    "Industry                the six sections from the Industries page"
)
hF = box(0, cur, 1500, 60, "The eleven facets", facets, "white",
         fs_t=17, fs_b=12, mono_body=True, align="left", vtop=True)
why_f = (
    "True is the ONLY one of the five with real faceted search\n"
    "(/advanced-search). At 300+ model codes this stops being a\n"
    "nice-to-have: a flat list is unusable, and a category grid alone\n"
    "cannot answer \"two-door undercounter freezer under 900 mm wide\".\n\n"
    "FREE-TIER IMPLEMENTATION\n"
    "  Facets are COLUMNS plus a GIN index, not a search service.\n"
    "  tsvector + pg_trgm behind the text box.\n"
    "  Filter state lives in the URL, so a filtered view is linkable,\n"
    "  crawlable and CDN-cacheable.\n"
    "  ISR-render only the ~40 most common facet combinations; the\n"
    "  long tail resolves client-side against a ~60 KB static index.\n"
    "  A visitor filtering the catalogue never wakes Postgres.\n\n"
    "SWAP POINT   lib/search.ts -> Typesense when facet COUNTS and\n"
    "  typo tolerance are wanted. Same search(q, facets) signature,\n"
    "  so no call site changes.  (Seam 10, §8.)"
)
hF2 = box(1540, cur, W_ALL - 1540, 60, "Why it is worth building, and how it stays free", why_f,
          "white", fs_t=17, fs_b=12, mono_body=True, align="left", vtop=True)
cur += max(hF, hF2) + 60

# ============================================================ 6 · ENQUIRY PATH
cur = h2(cur, "6 · The enquiry path — the only revenue-carrying write on the site",
         "Nine steps. The durability boundary is the database commit at step 2; everything after it is best-effort "
         "delivery on top of a row that is already safe.")
steps = [
    ("1  Enquiry arrives", "From a model page (model\npre-filled), a category page,\nor the wa.me deep link.\nTurnstile + honeypot +\nper-IP Redis bucket.\nIdempotency-Key header.", "white"),
    ("2  ONE Postgres txn", "INSERT lead\n+ INSERT lead_item[]\n  (model + quantity -- this\n  IS the quote request)\n+ INSERT outbox\nCommit. Now it is safe.", "pick"),
    ("3  202 to browser", "lead_ref returned in\n< 300 ms. No third party\nwas on this path.", "white"),
    ("4  Opportunistic push", "fetch -> QStash.\n.catch(() => {}) --\nfailure is survivable.", "white"),
    ("5  QStash delivers", "POST /api/jobs/lead-notify\nSignature verified.\n3 retries, then DLQ.", "white"),
    ("6  Fan-out, channel picked\n    by how they arrived",
     "Telegram to the sales desk,\ninstant.\nCustomer ack:\n WhatsApp window open ->\n   free Service message\n form only -> email after\n   10 min (the fallback)", "white"),
    ("7  Backstop", "15-min sweeper. Checks a\nRedis flag first, so it only\nwakes Postgres if there\nis real work to do.", "pick"),
    ("8  Probe", "GitHub Actions posts a\nsynthetic lead every 15 min\nand asserts it lands.", "white"),
    ("9  Alarm", "Zero leads in a business\nhour, or DLQ depth > 0,\n-> Telegram page.", "maybe"),
]
hS = grid(steps, 0, W_ALL, cur, 5, gap=16, vgap=16, min_h=136,
          fs_t=14.5, fs_b=11.5, align="left", vtop=True)
cur += hS + 20
hW = box(0, cur, W_ALL, 60,
         "Why the free tier costs you latency, not safety",
         "The commit at step 2 is the durability boundary, exactly as in HLD.md. Steps 4-6 are best-effort delivery on top of "
         "a row that is already committed. QStash can be down, over quota or slow: the lead is not lost, it is late, and step 7 "
         "collects it. What the free tier costs is the worst-case notification latency — seconds becomes at most 15 minutes. "
         "What it does not cost is a dropped enquiry, and one lost RFQ is worth more than a year of hosting.",
         "note", fs_t=16, fs_b=13, align="left", vtop=True)
cur += hW + 60

# ============================================================ 7 · RENDER & COST
cur = h2(cur, "7 · What it costs to serve all of that — the $0 topology",
         "The feature set above maps onto four render modes and three stores. Quotas on every box, verified from each "
         "provider's own pricing page on 2026-10-07. Ledger down the right.")
top = cur
y = cur

y = band(y, "(1) EDGE\ntwo CDNs, both\nfree, each doing\nwhat it is best at", [
    ("kalt.example  ->  Vercel edge CDN",
     "HTML only, ~15-40 KB/page. At 300k pageviews that is ~12 GB/mo,\n"
     "a fraction of the Hobby allotment. Static + ISR output served\n"
     "from the PoP with no origin hop.", "edge"),
    ("cdn.kalt.example  ->  Cloudflare R2 + CDN",
     "ALL product photos, spec sheets, manuals, CAD files, CVs.\n"
     "R2 free: 10 GB-month, and -- the reason this works -- EGRESS IS\n"
     "FREE at any volume. The nine files per model never touch Vercel.", "pick"),
], fs_t=15, fs_b=11.5, min_h=118, tone="edge")

y += GAP
y = band(y, "(2) RENDER\nwhich page is\nserved how", [
    ("SSG at build",
     "Home · Industries · About ·\nService & Support · Privacy ·\nTerms.  Six of the nine\npages are pure static.\n$0, 0 ms origin.", "web"),
    ("ISR -- on-demand ONLY",
     "Products hub · 6 category\npages · N model pages ·\nDownloads.\nrevalidate = false; freshness\nvia revalidateTag() from the\npublish event. Time-based ISR\nis a hidden DB poll.", "pick"),
    ("SSR  /admin",
     "Auth.js magic link, server\nactions, 3 staff users.\nThe only routinely dynamic\nsurface on the whole site.", "web"),
    ("Route handlers",
     "/api/leads        the hot write\n/api/jobs/[task]  QStash target\n/api/cron/[job]   cron target\n/api/revalidate   publish hook\nAll <= 60 s (Hobby cap).", "web"),
], fs_t=15, fs_b=11.5, min_h=146, tone="web")

y += GAP
y = band(y, "(3) MODULES\n\none folder = one\nfuture service.\nOne ESLint rule\nholds the boundary.", [
    ("catalog", "categories, models, specs,\nfacet columns, price_* (NULL)", "svc"),
    ("content", "pages, industries, news.\nMarketing copy in MDX.", "svc"),
    ("leads", "form, outbox, dedupe,\nTelegram + ack. The one\nrevenue write path.", "svc"),
    ("documents", "spec sheets, manuals, CAD.\nPer RANGE, not per SKU.", "svc"),
    ("media", "upload, AVIF derive,\nbudget enforcement", "svc"),
    ("search", "tsvector + pg_trgm + facet\ncolumns. Swap -> Typesense", "svc"),
    ("notify", "WhatsApp + Telegram,\nResend as fallback.", "svc"),
    ("outbox", "publish() + sweeper().\nThe durability boundary.", "svc"),
], cols=4, fs_t=15, fs_b=11.5, min_h=88, tone="svc")

y += GAP
y = band(y, "(4) DATA", [
    ("Neon PostgreSQL  (free)",
     "1 GB storage  ·  100 CU-HOURS/month  ·  scale-to-zero after 5 min,\n"
     "CANNOT be disabled  ·  10 branches  ·  6 h history  ·  NO backups\n\n"
     "THE BINDING LIMIT IS COMPUTE, NOT STORAGE:\n"
     "100 CU-h / 0.25 CU = 400 h active per month out of 720.\n"
     "Any poll tighter than ~15 min keeps it awake 24/7 = 1.8x over.\n"
     "=> on-demand ISR only, a Redis-gated sweeper, and a filter UI\n"
     "   that resolves client-side. The DB sleeps between writes.\n"
     "Projected: 61 of 100 CU-hours.", "pick"),
    ("Cloudflare R2  (free)",
     "10 GB-month, egress free.\n\n"
     "products/  1.7 GB  (5 AVIF widths,\n   2400px master IS the original)\n"
     "docs/      2.5 GB  (spec sheets,\n   manuals, CAD -- per RANGE,\n   ~80 PDFs not 700)\n"
     "cv/        1.2 GB  (12-mo lifecycle\n   delete = DPDP retention)\n"
     "backups/   1.0 GB  (30 nightly dumps)\n"
     "archive/   0.2 GB\n"
     "headroom   3.4 GB", "pick"),
    ("Upstash Redis  (free)",
     "500K commands/month, 256 MB.\n\n"
     "THE RULE: a page view never touches\n"
     "Redis and never touches Postgres.\n\n"
     "Writes only:\n"
     " · rate-limit buckets      36k/mo\n"
     " · idempotency keys         5k/mo\n"
     " · outbox work-pending flag 3k/mo\n"
     " · WhatsApp + Resend quota\n"
     "   counters                 5k/mo\n"
     "   = 49k of 500k  (10%)", "pick"),
], fs_t=15, fs_b=11.5, min_h=240, tone="data")

y += GAP
y = band(y, "(5) ASYNC &\n     EXTERNAL", [
    ("QStash  (free)",
     "1,000 messages/DAY.\nRetries + DLQ built in.\nEvery attempt counts.\nProjected 301/day (30%).", "pick"),
    ("Schedulers x3",
     "QStash    15 min sweeper\nGH Actions 15 min probe\n  -- neither built --\nVercel     03:00 maintenance\n           03:30 guardrails\n  -- both BUILT --\n(Hobby cron = DAILY only)", "async"),
    ("WhatsApp Cloud API",
     "1,000 SERVICE msgs/month\nFREE per business number.\nFree-form only inside a\n24-h window THE CUSTOMER\nopened -- so wa.me becomes\na PRIMARY enquiry path.", "pick"),
    ("Telegram hook",
     "Instant sales alert.\nFree, unlimited. Replaces\n80 notification emails/day.", "pick"),
    ("Resend  (fallback)",
     "3,000/mo but 100/DAY.\n~22/day once acks move to\nWhatsApp: form-only\nfallback, digest, magic\nlinks.", "pick"),
    ("Turnstile", "Bot defence on both forms.\nFree, unlimited.", "pick"),
    ("CF Analytics + GA4", "Cookieless, unlimited.", "pick"),
    ("Sentry", "5,000 errors/month.\nVercel keeps logs 1 h --\nthis is the real log store.", "maybe"),
], cols=4, fs_t=14.5, fs_b=11, min_h=104, tone="async")
topo_bottom = y

# ---- right rail: ledger
rbg = rect(RAIL_X, top, RAIL_W, topo_bottom - top, PAL["plat"][0], PAL["plat"][1],
           sw=1.5, r=14, dash="dashed")
ry = top + 18
text(RAIL_X + 20, ry, wrap("FREE-TIER LEDGER", RAIL_W - 40, 17, False, 0), 17, INK,
     "left", False, 1.2, RAIL_W - 40)
ry += 17 * 1.2 + 4
text(RAIL_X + 20, ry, wrap("Verified from each provider's own pricing page, 2026-10-07. Re-verify before launch; "
                           "these move. Adding the full nine-file download set per model is the only feature above "
                           "that moves a gauge — it lands in R2, which is why R2 is the tightest number here.",
                           RAIL_W - 40, 11.5, False, 0),
     11.5, MUTE, "left", False, 1.3, RAIL_W - 40)
ry += 74
for g in [
    ("Cloudflare R2  storage", "6.6", "10", "GB", 66, "spec sheets + CAD + 5 AVIF widths per model"),
    ("Neon  CU-hours/month", "61", "100", "", 61, "the binding constraint; can spike"),
    ("WhatsApp  service msgs/mo", "480", "1000", "", 48, "overflow is metered, not a cliff"),
    ("QStash  messages/day", "301", "1000", "", 30, "retries count as messages"),
    ("Neon  storage", "291", "1024", "MB", 28, "at 12 months, with pruning"),
    ("Resend  emails/day", "22", "100", "", 22, "was 86 -- acks moved to WhatsApp"),
    ("Upstash  commands/month", "49k", "500k", "", 10, "writes only, never a page view"),
    ("Vercel  bandwidth/month", "~12", "100", "GB", 12, "HTML only; all media is on R2"),
]:
    ry += gauge(RAIL_X + 20, ry, RAIL_W - 40, *g) + 12
rbg["h"] = max(rbg["h"], ry - top + 8)
cur = max(topo_bottom, ry) + 60

# ============================================================ 8 · SEAMS
cur = h2(cur, "8 · Scaling seams — what is free now, and the exact thing that changes later",
         "Every card is an environment variable or a single adapter file. Not one requires touching app/ or modules/. "
         "Seam 16 is the pricing seam from §4.")
seams = [
    ("1 · Host",
     "NOW    Vercel Hobby\nBREAKS commercial-use policy, day one\nTHEN   Vercel Pro $20/mo  OR  CF Workers $0\nCHANGE nothing  /  add @opennextjs/cloudflare", "reject"),
    ("2 · Media & document storage",
     "NOW    R2 free, 10 GB, egress free\nBREAKS > 8.5 GB -- the nine-file download set\n       per model is what fills this\nTHEN   R2 paid, $0.015/GB-month\nCHANGE nothing. Same bucket, a card on file.", "pick"),
    ("3 · Image transforms",
     "NOW    pre-generated AVIF variants in R2\nBREAKS need per-request crops / art direction\nTHEN   Cloudflare Images or Vercel Optimizer\nCHANGE lib/image-loader.ts -- 4 lines", "pick"),
    ("4 · Database",
     "NOW    Neon Free, 1 GB / 100 CU-hours\nBREAKS > 80 CU-hours, or > 800 MB\nTHEN   Neon Launch/Scale, or RDS\nCHANGE DATABASE_URL", "pick"),
    ("5 · Read scaling",
     "NOW    none -- the CDN is the read replica\nBREAKS p95 DB CPU > 60%\nTHEN   Neon read replica\nCHANGE DATABASE_URL_RO + lib/db.ts", "pick"),
    ("6 · Queue",
     "NOW    QStash free, 1,000 msgs/day\nBREAKS > 700/day sustained\nTHEN   QStash PAYG $1/100k, Inngest, SQS\nCHANGE lib/queue.ts -- one publish()", "pick"),
    ("7 · Scheduler",
     "NOW    QStash schedules + GitHub Actions\n       + daily Vercel Cron\nBREAKS need sub-minute precision\nTHEN   Vercel Pro cron (per-minute)\nCHANGE vercel.json cron expressions", "pick"),
    ("8 · Workers",
     "NOW    route handlers, <= 60 s\nBREAKS a job > 60 s -- bulk SKU import or a\n       large catalogue PDF render\nTHEN   CF Queues consumer, Railway worker\nCHANGE the job body moves; modules/ untouched", "maybe"),
    ("9 · Cache",
     "NOW    ISR + Data Cache; Redis for writes only\nBREAKS > 350k Redis commands/month\nTHEN   Upstash PAYG, $0.20/100k\nCHANGE nothing -- billing only", "pick"),
    ("10 · Search & facets",
     "NOW    tsvector + pg_trgm + facet columns\nBREAKS need facet COUNTS, typo tolerance, or\n       full-text search inside the spec PDFs\nTHEN   Typesense Cloud / OpenSearch\nCHANGE lib/search.ts -- same search(q, facets)", "pick"),
    ("11 · Notifications",
     "NOW    WhatsApp 1,000 free service msgs/mo\n       + Telegram + Resend fallback\nBREAKS > 1,000 WhatsApp service msgs/month\nTHEN   Meta per-message India rate -- metered,\n       not a cliff\nCHANGE nothing. lib/notify.ts already picks\n       the channel per lead.", "pick"),
    ("12 · Analytics",
     "NOW    Cloudflare Web Analytics + GA4\nBREAKS need funnel attribution on enquiries\nTHEN   PostHog or ClickHouse\nCHANGE lib/analytics.ts", "pick"),
    ("13 · Error tracking",
     "NOW    Sentry free, 5k errors/month\nBREAKS > 5k errors/month\nTHEN   Sentry Team\nCHANGE billing only", "pick"),
    ("14 · Logs",
     "NOW    Vercel Hobby keeps logs ONE HOUR\nBREAKS any incident older than an hour --\n       the sharpest everyday pain\nTHEN   Vercel Pro (1 day) or Axiom free (500 MB)\nCHANGE lib/logger.ts transport", "maybe"),
    ("15 · Backups",
     "NOW    nightly pg_dump -> R2 (Neon Free has NO\n       scheduled backups, 6 h history)\nBREAKS RPO of 24 h unacceptable\nTHEN   Neon paid: PITR to the second\nCHANGE delete the cron job", "maybe"),
    ("16 · PRICING          <- the new seam",
     "NOW    price_* columns exist and are NULL;\n       <PriceSlot/> renders nothing\nBREAKS the day the business decides to publish\nTHEN   indicative / list / dealer-only (§4)\nCHANGE set price_visibility + fill the columns.\n       Dealer-only ALSO needs accounts + an auth\n       boundary -- that one is not a one-liner.", "maybe"),
]
hSe = grid(seams, 0, W_ALL, cur, 4, gap=20, vgap=18, min_h=152,
           fs_t=16, fs_b=11.5, mono_body=True, align="left", vtop=True)
cur += hSe + 60

# ============================================================ 9 · PHASE 2 / OMITTED
cur = h2(cur, "9 · Phase 2, and what is deliberately not built")
p2 = (
    "ADD WHEN THE CONTENT EXISTS, NOT BEFORE\n"
    "---------------------------------------------------------------------\n"
    "10  Dealer / network locator          4/5 of the sites have one, and\n"
    "    in India the dealer IS the buying channel. Blocked only on having\n"
    "    dealers to list. Promote it to v1 the day the list exists -- an\n"
    "    empty map is worse than no map.\n\n"
    "11  Why Us / Technology               Traulsen runs five such pages\n"
    "    (temperature-airflow, smart-control, stayclear-condenser-coil,\n"
    "    ez-clean-gasket, ezclean-trayracks). Only worth building when the\n"
    "    claims are real and the test data exists. Invented\n"
    "    differentiators are worse than none.\n\n"
    "12  Installations / case studies      HIGH VALUE, 1/5 convergence --\n"
    "    only Blue Star has it, which is the opportunity rather than a\n"
    "    reason to skip. A bakery owner seeing three bakeries you have\n"
    "    fitted out beats any amount of copy.\n"
    "    START PHOTOGRAPHING INSTALLATIONS NOW, before the page exists.\n\n"
    "13  News & Insights                   Conditional on publishing\n"
    "    monthly for a year. Western's blog is the model: every post is a\n"
    "    product page in disguise, tagged to the product it sells. A blog\n"
    "    whose newest post is 14 months old actively damages trust.\n\n"
    "14  Careers                           Expected (5/5) but serves\n"
    "    recruitment, not customers. \"Write to careers@\" is an acceptable\n"
    "    v1. Do not let it compete with the product template for effort."
)
hP2 = box(0, cur, 1430, 60, "Phase 2 — five more pages", p2, "white",
          fs_t=18, fs_b=12, mono_body=True, align="left", vtop=True)
omit = (
    "LEAVE OUT                      FOUND ON       WHY NOT\n"
    "---------------------------------------------------------------------------\n"
    "Serial number lookup           True           needs an installed base\n"
    "4 separate warranty forms      True           one service form covers it\n"
    "Parts e-commerce + tracking    True, Bev-Air  a whole storefront\n"
    "Account login / cart           Bev-Air        no prices means no cart\n"
    "\"Build & price\" configurator    none           0 of 5 publish a price\n"
    "Investor relations             Blue Star      not your obligation\n"
    "Governance / group companies   Blue Star      conglomerate noise\n"
    "Separate Sustainability page   3 of 5         a section inside About\n"
    "Separate R&D / Factories       2 of 5         sections inside About\n"
    "Separate press-release feed    2 of 5         one News feed\n"
    "White paper library            Traulsen       needs real research\n"
    "Video library page             Bev-Air, Trau. embed on the product page\n"
    "6 separate industry pages      True (14!)     one page, six anchors\n"
    "Multi-slide hero carousel      2 of 5         slides 2+ are not seen\n"
    "Horizontal-scroll showcase     index.html §6  no sales function\n"
    "\n"
    "THE RULE: every page ships with content on day one. Nine complete pages\n"
    "beat twenty-five pages where eighteen say \"coming soon\" -- which is how\n"
    "copying True's support tree would leave you.\n"
    "\n"
    "ALSO CUT FROM THE CURRENT index.html (report §11):\n"
    "  §5  \"build & price\" CTA        implies pricing -> [Request a Quote]\n"
    "  §6  horizontal-scroll section  420vh of scroll-jacking, no sales job\n"
    "  §7  \"Try it for free!\" CTA     a SaaS pattern inherited from unox.com.\n"
    "                                 You cannot try a refrigerator for free.\n"
    "  §9  merge into §4              \"choose by type\" duplicates the rail\n"
    "  ADD a client logo strip        missing, and the cheapest credibility\n"
    "                                 available on the page.\n"
    "  Net: thirteen sections -> ten. The page gets shorter and converts better."
)
hOm = box(1470, cur, W_ALL - 1470, 60, "Deliberately not built", omit, "white",
          fs_t=18, fs_b=12, mono_body=True, align="left", vtop=True)
cur += max(hP2, hOm) + 60

# ============================================================ 10 · BUILD ORDER
cur = h2(cur, "10 · Build order",
         "The instinct is to build the home page first. Resist it: a beautiful home page over an empty catalogue converts "
         "nothing, while a plain catalogue with complete spec sheets converts immediately.")
order = [
    ("PHASE 1",
     "Product Detail template\n+ 6 category pages\n+ Products hub\n\nTHIS IS THE SITE. Organic\nsearch lands here and the\nenquiry is made here.", "pick"),
    ("PHASE 2",
     "Contact & Enquiry\nService & Support\nDownloads\n\nCloses the loop on every\nCTA the product pages fire.", "web"),
    ("PHASE 3",
     "Home\nIndustries\nAbout Us\n\nThe framing. Worth less\nthan people assume --\nbuild it after the\ncatalogue works.", "web"),
    ("PHASE 4",
     "Privacy · Terms\nsitemap · robots · schema\n\nRequired, thin, and the\nschema.org markup is how\nthe catalogue gets found.", "plat"),
    ("PHASE 5",
     "Dealer locator\nInstallations\nWhy Us · News · Careers\nTHE PRICING DECISION (§4)\n\nEach on the day its\ncontent actually exists.", "maybe"),
]
hO = row(order, 0, W_ALL, cur, gap=20, min_h=168,
         fs_t=16, fs_b=12, align="left", vtop=True)
cur += hO + 40

text(0, cur, wrap("Legend:  green = free and comfortable, or a must-have that is settled  ·  amber = free but close to a limit, "
                  "a deferred decision, or a known degradation  ·  red = blocked, non-compliant, or deliberately not built  ·  "
                  "blue/teal = render and web tier  ·  pink = module boundary.   Convergence counts and page contents trace to "
                  "docs/ia/SITE-SECTIONS-REPORT.md.   All provider quotas verified 2026-10-07 and subject to change.",
                  W_ALL, 13, False, 0), 13, MUTE, "left", False, 1.4, W_ALL)

# ============================================================ EMIT
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
n = to_excalidraw(os.path.join(OUT, "ss-refrigeration-free-tier.excalidraw"))
w, h = to_svg(os.path.join(OUT, "ss-refrigeration-free-tier.svg"))
print("elements: %d" % n)
print("svg canvas: %.0f x %.0f" % (w, h))
