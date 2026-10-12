---
name: frontend-check
description: Verify frontend work in headless Chrome before reporting it done. Use for ANY change that affects what a page looks like — CSS, a component, a page, layout, responsive behaviour, a new route — and whenever asked to "view", "look at", "check" or "screenshot" the site. Renders each route at desktop and phone width, screenshots it, and fails on an unattached stylesheet, a console error, a failed request or horizontal overflow.
---

# Frontend check

**A route returning 200 is not evidence that it looks right.** This project has
already shipped a state where every page returned 200, every internal link
resolved, the HTML was complete — and the site rendered as unstyled text,
because the dev server was serving HTML that referenced a stylesheet it had
never written. `curl` cannot see that. A browser can.

So: **no frontend change is reported as done until it has been looked at in
headless Chrome.** Screenshots are read back with the Read tool and actually
examined — the point is to see the page, not to collect PNGs.

## The tool

`scripts/browser-check.mjs` drives Chrome over the DevTools Protocol. No
Playwright, no Puppeteer — it uses `ws`, which is already a dependency.

```powershell
# every default route, desktop + phone, full page
node scripts/browser-check.mjs

# specific routes
node scripts/browser-check.mjs /support /products/deep-freezer

# one viewport, above the fold only (readable for review)
node scripts/browser-check.mjs --viewports 390x844 --fold /contact

# a section further down the page
node scripts/browser-check.mjs --viewports 390x844 --scroll 1200 /support

# against a production server instead of dev
node scripts/browser-check.mjs --base http://127.0.0.1:3100 /
```

Screenshots land in `.browser-check/` (git-ignored), named
`<route>@<viewport>.png`.

**Run it from PowerShell.** Git Bash rewrites a bare `/` argument into a
Windows path; the script detects that and exits with a message, but PowerShell
avoids it entirely.

## What it checks, and why each one exists

| Check | The bug it catches |
|---|---|
| `document.styleSheets.length` | The stylesheet 404 above — a `<link>` can be present and the file absent |
| `--accent` resolved off `:root` | globals.css parsed but produced no tokens |
| `.panel` computed background | CSS served as HTML (404 page) — rules exist but never apply |
| `scrollWidth > clientWidth` | Horizontal overflow at phone width, which screenshots flatter you about |
| console errors + exceptions | Hydration mismatches, client-component crashes |
| failed requests | Missing images, missing fonts, 404 assets |
| broken `<img>` (`naturalWidth === 0`) | A wrong `/products/<slug>.jpg` path |

Exit code 1 on any failure, so it works in a hook or in CI as well as by hand.

## The procedure

1. **Make sure a server is up.** `npm run dev` on :3000 is the normal target.
   For release-shaped verification, `npm run build` then
   `npx next start -p 3100` and pass `--base http://127.0.0.1:3100`.
2. **Run the check** over the routes your change touched — plus `/` if you
   touched anything shared (globals.css, the header, the footer, page-shell).
3. **Read the screenshots back** with the Read tool and look at them. Desktop
   full-page shots are legible; a full-page *phone* shot is ~10,000 px tall and
   scales down to nothing, so review phones with `--fold` and `--scroll`.
4. **Fix what you see**, not only what the checks report. The checks catch
   broken; your eyes catch wrong — order of blocks, cramped columns, a value
   wrapping mid-unit.
5. **Re-run until clean**, then report, saying which routes and viewports you
   actually looked at.

## Project rules this earns you

- **Exactly one process may write `.next`.** Two things break this, with the
  same misleading symptom — every route 200, complete HTML, no CSS at all:
  - `next build` while `next dev` is running;
  - **two dev servers.** `next dev` does not fail when port 3000 is taken, it
    slides to 3001 and keeps compiling into the same `.next`, overwriting the
    chunks the :3000 server is serving. `npm run dev` now refuses to start in
    that situation (`scripts/guard-dev.mjs`); do not work around it with
    `SKIP_DEV_GUARD=1` unless the second server has its own `distDir`.
- **Before trusting a passing run, check there is only one server:**
  `Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -ge 3000 -and $_.LocalPort -le 3010 }`.
  A check can pass at the instant it runs and the site be broken a minute
  later, because the other process recompiles on the next edit.
- If a dev server behaves impossibly — missing CSS, "Cannot find module for
  page: /x/page" at build — the cause is almost always a raced `.next`. Stop
  every node process, `rm -rf .next`, start one, hard-refresh. Fix the state
  before debugging the code.
- The dev-tools badge in the bottom-left of screenshots is Next's own overlay,
  not a layout bug.
