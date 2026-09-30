# KALT Refrigeration — demo landing page

A single-page, front-end-only landing page for a commercial refrigeration brand,
built to match the layout and rhythm of [unox.com](https://www.unox.com/en_in/).

**This is a demo.** No routing, no backend, no analytics. Every off-page link is
inert and shows a small toast instead of navigating.

---

## Run it

No build step, no dependencies.

- **Double-click `index.html`**, or
- **F5 in VS Code** — [.vscode/launch.json](.vscode/launch.json) is set up, or
- `python -m http.server 8000` → <http://localhost:8000>

---

## Deploy

A static folder, so anything that serves files will host it.

| Host | How |
|---|---|
| **Netlify** | Drag the folder onto <https://app.netlify.com/drop>. Live in ~30s. |
| **Cloudflare Pages** | New project → *Direct Upload* → drop the folder. |
| **Vercel** | `npm i -g vercel && vercel` here. Accept the defaults. |
| **GitHub Pages** | Push → Settings → Pages → deploy from `main`, root. |

No build command, no output directory. If a host asks, leave the build command
empty and set the publish directory to `.` (repo root).

---

## Design tokens

These are **measured from the reference site's computed styles**, not guessed —
captured by driving headless Chrome at unox.com over the DevTools Protocol.

| Token | Value |
|---|---|
| Heading font | **Montserrat 600** (`--displayFont` / `--headingFont`) |
| Body / UI font | **Roboto** (`--paragraphFont`, `--buttonFont`, `--labelFont`) |
| Type scale | hero **72px** · section **52px** · card **24px** |
| Line height | **1.15** across all headings, letter-spacing `0` |
| Container | **1440px** max-width, **24px** gutters |
| Accent | **`#0073e1`** (their `--accent: 0,115,225`) |
| Grounds | `#fff` / `#000` / `#f5f5f5`, alternating by section |

All of it lives in `:root` at the top of [`assets/css/styles.css`](assets/css/styles.css).

---

## Section order

The page alternates white, black and light-grey grounds the same way the
reference does — it is deliberately *not* all-black.

| # | Section | Ground |
|---|---|---|
| 1 | Utility bar + main nav | black |
| 2 | Hero slideshow — 5 slides, auto-advance 6s, dots, dismissible promo bar | photo |
| 3 | "Commercial refrigeration to build your success." + industry rail | white |
| 4 | "Most popular." product rail | white |
| 5 | "KALT build & price" CTA | grey |
| 6 | **Individual Cooling Experience** — horizontal scroll + progress bar | black |
| 7 | "Try it for free!" CTA | black |
| 8 | "Much more than just commercial refrigeration." — 6 dark cards | white |
| 9 | "Choose by type." rail with badges | white |
| 10 | "KALT services." bento grid | grey |
| 11 | Sustainability slideshow, full-bleed | photo |
| 12 | "Latest blog articles." | white |
| 13 | Newsletter + contact cards + footer + social | black |

### The horizontal-scroll section

Section 6 is the one from reference screenshots 7–8. `.ice` is `420vh` tall; its
inner panel is `position: sticky`, and vertical scroll progress is mapped onto a
horizontal `translate3d` of the track while a bar at the bottom fills left-to-right.
The maths is in the `ice()` block of [`assets/js/main.js`](assets/js/main.js) —
progress is `-rect.top / (sectionHeight - viewportHeight)`, clamped 0–1.

To make the slide longer or shorter, change `--ice` height in the CSS; the JS
derives everything from the measured element, so nothing else needs touching.

---

## Images

All photos are **stored locally** in `assets/img/photos/` as WebP rather than
hot-linked, so the page renders offline, deploys as one self-contained unit and
does not depend on a third party staying up.

They are Unsplash photographs downloaded at the exact width each slot needs —
the five hero slides at **2400px** (all verified as true 2400px source, not
upscaled), cards at 400–1400px. `assets/img/photos/_sources.json` maps every file
back to its Unsplash page for attribution. Filenames describe their slot
(`hero-bakery-2400.webp`, `ind-restaurants-800.webp`) — **to swap in the
customer's real photography, overwrite the file at the same path**; no markup
changes needed.

Hero slides, in order: bright café · chef at the pass · bakery shop · supermarket
aisle · cold store.

`assets/img/kalt-logo.png` is the supplied logo, cropped to its bounding box with
the black field made transparent so it composites on any background.

**Known gap:** the reference uses isolated product renders on white in "Most
popular" and "Choose by type". Stock photography has no equivalent, so those
cards use lifestyle shots instead. Real product cut-outs would close the last
visible difference between this and the reference.

---

## Verified

Driven through Chrome DevTools Protocol, not eyeballed:

- 44 images, **0 broken**
- **0 horizontal overflow** at 390 / 480 / 768 / 1024 / 1280 / 1440 / 1600 / 1920px
- Heading renders as Montserrat **52px w600**, hero **72px** — matching the reference exactly
- Hero dots switch slides; promo bar dismisses; sustainability arrows advance;
  rails step and clamp at both ends; scroll progress bar tracks 5% → 50% → 95%
- Skip link, focus rings, `aria-expanded` on the menu, `prefers-reduced-motion` honoured

---

## Placeholders

Copy, product names (BLIZZARD-X™, GLACIER PRO™, FROSTLINE™ …), phone numbers and
`@kalt.example` addresses are invented for the demo. Replace them before this is
shown as a real site.
