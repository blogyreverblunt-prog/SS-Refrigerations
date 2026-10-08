# HLD deliverables

Two designs for the same system. Read the free-tier one if you are building it now.

## The free-tier build (Phase 1, $0/month)

| File | What it is |
|---|---|
| **[`HLD-FREE-TIER.md`](HLD-FREE-TIER.md)** | **Start here.** Vercel Hobby + free-tier Phase 1 — R2 storage pipeline, $0 async, the Neon compute budget, repo structure, and the 15-row scaling-seams map |
| [`ss-refrigeration-free-tier.excalidraw`](ss-refrigeration-free-tier.excalidraw) | The free-tier diagram, editable (349 elements). **Rev 2.0** — now leads with the site feature map from [`../ia/SITE-SECTIONS-REPORT.md`](../ia/SITE-SECTIONS-REPORT.md) |
| [`ss-refrigeration-free-tier.svg`](ss-refrigeration-free-tier.svg) · [`.png`](ss-refrigeration-free-tier.png) | Same, 3016 × 7399 |

## The target architecture (Phase 2–3, paid)

| File | What it is |
|---|---|
| [`HLD.md`](HLD.md) | The full design — requirements, capacity model, architecture, **full DDL**, ADR-0001 (database choice and rejected alternatives), scaling triggers, risks |
| [`ss-refrigeration-hld.excalidraw`](ss-refrigeration-hld.excalidraw) | The target diagram, editable (339 elements) |
| [`ss-refrigeration-hld.svg`](ss-refrigeration-hld.svg) · [`.png`](ss-refrigeration-hld.png) | Same, 3016 × 6085 |

`HLD-FREE-TIER.md` supersedes only §10 Phase 1 of `HLD.md`. **The data model (§7) and ADR-0001
"why PostgreSQL" (§8) carry over unchanged** — that is the whole point of the exercise.

## Two things to know before building

1. **Vercel Hobby forbids commercial use.** Their Fair Use Guidelines: *"Hobby teams are restricted
   to non-commercial personal use only."* Build on Hobby; launch on Vercel Pro ($20/mo) or
   Cloudflare Workers ($0, commercially permitted). See `HLD-FREE-TIER.md` §0.1.
2. **Every quota in the free-tier doc was verified on 2026-10-07** against each provider's own
   pricing page. They move. Re-verify before launch — §1 is the checklist.

## Shared source

| | |
|---|---|
| [`_src/gen_core.py`](_src/gen_core.py) | Layout + dual-backend renderer |
| [`_src/gen_hld.py`](_src/gen_hld.py) | The target-architecture canvas |
| [`_src/gen_free.py`](_src/gen_free.py) | The free-tier canvas |

Both the `.excalidraw` and the `.svg` are emitted from one layout spec, so they can never disagree.

```bash
cd docs/hld/_src
python gen_hld.py ..          # → ../ss-refrigeration-hld.{excalidraw,svg}
python gen_free.py ..         # → ../ss-refrigeration-free-tier.{excalidraw,svg}
```

No dependencies — standard library only. To refresh a PNG:

```bash
chrome --headless=new --screenshot=../ss-refrigeration-free-tier.png \
       --window-size=3016,7399 --default-background-color=FFFFFFFF \
       ../ss-refrigeration-free-tier.svg
```

If you edit a diagram by hand in Excalidraw, the generator becomes stale — either fold the change
back into `_src/`, or delete `_src/` and own the files manually.

## Opening the Excalidraw files

1. Go to <https://excalidraw.com>
2. Drag the `.excalidraw` file onto the canvas — **or** *Menu → Open*
3. `Shift + 1` zooms to fit

Also opens in the Excalidraw VS Code extension (`pomdtr.excalidraw-editor`) by clicking the file.

> Dragging **replaces** the current canvas. Use *Menu → Open* if you have unsaved work.

## How to read the diagrams

**Target architecture** — top to bottom: 9 runtime layers · the two paths that must not break ·
27 entities in 4 clusters with index choices · why PostgreSQL and why not each alternative ·
4 scaling phases with their trigger metrics · capacity, SLOs and risks.

**Free tier (Rev 2.0)** — the one principle: every page funnels to an enquiry, there is no checkout ·
the 12-card page map, each card carrying its convergence count from the five-site audit · the product
taxonomy mapped 1:1 to the Hoshizaki range · the 13 blocks of the product detail page · **pricing,
deferred by decision and pre-cut by design** · the 11 facets · the 9-step enquiry path · the $0
topology with a quota on every box and a budget ledger down the right side · the 16-row seams map ·
Phase 2 and what is deliberately not built · build order.

Rev 1.0 led with the Vercel Hobby commercial-use blocker and the infrastructure; that blocker is still
on the canvas, now as a strip under the title rather than the headline. The feature content is new and
traces to [`../ia/SITE-SECTIONS-REPORT.md`](../ia/SITE-SECTIONS-REPORT.md).

**Colour key:** green = system of record / recommended / free and comfortable · amber = viable
alternative, or free but close to a limit · red = rejected, blocked, or non-compliant ·
`[seam]` = extract this service first · dashed container = logical grouping, not a deployment unit.
