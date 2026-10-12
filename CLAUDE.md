# SS Refrigeration — working rules

## Frontend work must be verified in headless Chrome

Any change that affects what a page looks like — CSS, a component, a page, a
route, responsive behaviour — is not finished until it has been rendered in
headless Chrome and the screenshots have been looked at.

Invoke the **`frontend-check`** skill, or run it directly:

```powershell
node scripts/browser-check.mjs                      # all default routes, desktop + phone
node scripts/browser-check.mjs /support             # specific routes
node scripts/browser-check.mjs --viewports 390x844 --fold /contact
```

It fails the run on an unattached stylesheet, a console error, a failed
request, a broken image or horizontal overflow, and writes screenshots to
`.browser-check/`. Read them back and examine them — a passing exit code means
nothing is broken, not that the page is right.

A 200 from `curl` is not evidence of a working page. This repo has already had
a state where every route returned 200 and the site rendered completely
unstyled.

## Exactly one process may write `.next` at a time

This is the single most expensive trap in this repo. Two things share
`.next`, and whichever writes second wins:

- **`next build` while `next dev` is running.** The build overwrites the dev
  server's chunks.
- **Two `next dev` servers.** If port 3000 is taken, `next dev` does not fail
  — it prints one line and starts on 3001, then compiles into the *same*
  `.next` and overwrites what the :3000 server is serving.

Either way the symptom is identical and misleading: every route returns 200,
the HTML is complete, and the site renders with **no CSS at all**, because the
running server is pointing at a stylesheet the other process replaced. It can
also surface as `Cannot find module for page: /x/page` for pages that plainly
exist.

`npm run dev` now runs `scripts/guard-dev.mjs` first and refuses to start when
something is already listening on the port. Override deliberately with
`$env:SKIP_DEV_GUARD=1`, and expect breakage if you do.

When a dev server behaves impossibly, fix the state before debugging the
code: stop every node process, `Remove-Item -Recurse -Force .next`, start one
server, hard-refresh the browser.

## Where things live

- `src/content/site.ts` — every company fact (phones, GSTIN, offices, service
  cities, warranty, AMC plans). No page hard-codes a business detail. Values
  still to be supplied render a TEMPLATE badge; `isTemplate: false` removes
  them all.
- `src/app/globals.css` — the whole design system, tokens first. Nothing below
  `:root` may hard-code a colour, size or radius.
- `docs/ia/SITE-SECTIONS-REPORT.md` and `docs/ia/PURE-PLAY-BENCHMARK.md` — why
  each page exists and what belongs on it. Read before adding a page.
- `docs/hld/HLD.md`, `docs/hld/HLD-FREE-TIER.md` — architecture, and the
  ISR-only rule: pages read the database at build or revalidation, never per
  visitor.
