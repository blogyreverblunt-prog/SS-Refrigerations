/**
 * browser-check.mjs — look at the site in a real browser, headlessly.
 *
 * Why this exists: `curl` tells you the HTML arrived, and `next build` tells
 * you it compiled. Neither tells you the page is STYLED. This project shipped
 * a session where the dev server served complete HTML referencing a
 * stylesheet it had never written — every page 200, every link valid, and the
 * site rendered as unstyled text. Only a browser catches that.
 *
 * It drives Chrome over the DevTools Protocol (no Playwright, no Puppeteer —
 * `ws` is already a dependency because of Neon), and per URL it collects:
 *
 *   · a PNG screenshot at each viewport, full page
 *   · every console error and every page exception
 *   · every request the browser failed to load (the stylesheet bug)
 *   · whether any stylesheet is actually ATTACHED and its rules applied,
 *     checked by reading a token off :root rather than counting <link> tags
 *   · horizontal overflow, which is the phone-width bug that screenshots
 *     flatter you about
 *
 * Exit code is 1 if any check fails, so it works in a hook or CI as well as
 * by hand.
 *
 * Usage
 *   node scripts/browser-check.mjs                       # default route set
 *   node scripts/browser-check.mjs /products /support    # specific routes
 *   node scripts/browser-check.mjs --base http://localhost:3100 /
 *   node scripts/browser-check.mjs --viewports 1360x900,390x844 /
 *   node scripts/browser-check.mjs --out .browser-check /
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";

/* ------------------------------------------------------------------ config */

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  `${process.env.LOCALAPPDATA ?? ""}/Google/Chrome/Application/chrome.exe`,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

/** The routes worth looking at every time. */
const DEFAULT_ROUTES = [
  "/",
  "/products",
  "/products/reach-in-refrigerator",
  "/industries",
  "/about",
  "/support",
  "/contact",
  "/downloads",
  "/compare",
];

const DEFAULT_VIEWPORTS = "1360x900,390x844";

function parseArgs(argv) {
  const out = {
    base: "http://127.0.0.1:3000",
    viewports: DEFAULT_VIEWPORTS,
    outDir: ".browser-check",
    routes: [],
    /** Capture only the viewport. A full-page phone shot is 10,000 px tall
        and unreadable once scaled down; the fold is what you review. */
    fold: false,
    /** Scroll this far down before capturing, for reviewing a section. */
    scroll: 0,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--base") { out.base = argv[++i]; continue; }
    if (a === "--viewports") { out.viewports = argv[++i]; continue; }
    if (a === "--out") { out.outDir = argv[++i]; continue; }
    if (a === "--fold") { out.fold = true; continue; }
    if (a === "--scroll") { out.scroll = Number(argv[++i]) || 0; out.fold = true; continue; }
    out.routes.push(a);
  }
  if (out.routes.length === 0) out.routes = DEFAULT_ROUTES;

  /*
    Git Bash rewrites an argument that looks like an absolute POSIX path into
    a Windows one, so `node scripts/browser-check.mjs /` arrives as
    "C:/Program Files/Git/". Fail loudly rather than asking Chrome to
    navigate to a drive letter.
  */
  for (const r of out.routes) {
    if (!r.startsWith("/") || /^[A-Za-z]:/.test(r) || r.includes("Program Files")) {
      console.error(
        `Route "${r}" is not a site path. On Git Bash a bare "/" is rewritten to a\n` +
        `Windows path — run this from PowerShell, or prefix with MSYS_NO_PATHCONV=1.`,
      );
      process.exit(2);
    }
  }
  return out;
}

/* ------------------------------------------------------- CDP, hand-rolled */

let nextId = 1;

/** One websocket to one page target, with promise-per-command. */
class Session {
  constructor(ws) {
    this.ws = ws;
    this.pending = new Map();
    this.listeners = [];
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
        return;
      }
      for (const fn of this.listeners) fn(msg);
    });
  }

  send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 30000);
    });
  }

  on(fn) { this.listeners.push(fn); }
  close() { this.ws.close(); }
}

async function fetchJson(url, method = "GET") {
  const res = await fetch(url, { method });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

/** Chrome 111+ requires PUT on /json/new; older builds accept GET. */
async function newTarget(endpoint) {
  const url = `${endpoint}/json/new?${encodeURIComponent("about:blank")}`;
  try {
    return await fetchJson(url, "PUT");
  } catch {
    return await fetchJson(url, "GET");
  }
}

async function waitFor(fn, { tries = 40, every = 250 } = {}) {
  let last;
  for (let i = 0; i < tries; i += 1) {
    try { return await fn(); } catch (e) { last = e; }
    await new Promise((r) => setTimeout(r, every));
  }
  throw last ?? new Error("timed out");
}

/* ---------------------------------------------------------- the page probe

   Runs IN the page. Everything it reports is something a screenshot alone
   would not tell you reliably.                                            */

const PROBE = `(() => {
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  const panel = document.querySelector('.panel');
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const res = performance.getEntriesByType('resource');
  const bytes = res.reduce((n, r) => n + (r.transferSize || 0), 0) + (nav.transferSize || 0);
  return {
    perf: {
      requests: res.length + 1,
      kb: Math.round(bytes / 1024),
      // Rounded: these are a smoke test for "did something get 10x worse",
      // not a lab measurement.
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      load: Math.round(nav.loadEventEnd || 0),
      lcp: window.__lcp ?? null,
    },
    // Evidence for the no-consent-banner decision: if this is ever non-empty,
    // the site needs one.
    cookies: document.cookie ? document.cookie.split(';').length : 0,
    // Third-party origins. Each one is a privacy promise you have to keep.
    thirdParty: [...new Set(res
      .map((r) => { try { return new URL(r.name).origin; } catch { return null; } })
      .filter((o) => o && o !== location.origin))],
    sheets: document.styleSheets.length,
    // The design system's own token. Empty means globals.css never applied,
    // whatever the <link> tags claim.
    accentToken: root.getPropertyValue('--accent').trim(),
    bodyBackground: body.backgroundColor,
    bodyFont: body.fontFamily,
    // A .panel with a transparent background is the signature of CSS that
    // loaded as 404 HTML rather than as a stylesheet.
    panelBackground: panel ? getComputedStyle(panel).backgroundColor : null,
    panelRadius: panel ? getComputedStyle(panel).borderRadius : null,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    title: document.title,
    h1: (document.querySelector('h1') || {}).textContent || null,
    imagesBroken: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
  };
})()`;

/* -------------------------------------------------------------------- main */

async function main() {
  const { base, viewports, outDir, routes, fold, scroll } = parseArgs(process.argv.slice(2));

  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) {
    console.error("No Chrome found. Set CHROME_PATH to the binary.");
    process.exit(1);
  }

  const sizes = viewports.split(",").map((v) => {
    const [w, h] = v.split("x").map(Number);
    return { w, h, label: v };
  });

  mkdirSync(outDir, { recursive: true });
  const profile = join(tmpdir(), `browser-check-${Date.now()}`);

  const proc = spawn(chrome, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  // Chrome prints the devtools endpoint to stderr when the port is 0.
  const endpoint = await new Promise((resolve, reject) => {
    let buf = "";
    const to = setTimeout(() => reject(new Error("Chrome did not report a debugging port")), 20000);
    proc.stderr.on("data", (d) => {
      buf += d.toString();
      const m = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (m) { clearTimeout(to); resolve(`http://127.0.0.1:${m[1]}`); }
    });
    proc.on("exit", (code) => { clearTimeout(to); reject(new Error(`Chrome exited (${code})`)); });
  });

  const failures = [];
  const rows = [];

  try {
    for (const route of routes) {
      for (const size of sizes) {
        const url = `${base}${route}`;
        const target = await waitFor(() => newTarget(endpoint), { tries: 8 });
        const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
        await new Promise((res, rej) => { ws.once("open", res); ws.once("error", rej); });
        const s = new Session(ws);

        const consoleErrors = [];
        const failedRequests = [];
        s.on((msg) => {
          if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
            consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "));
          }
          if (msg.method === "Runtime.exceptionThrown") {
            consoleErrors.push(msg.params.exceptionDetails.text ?? "exception");
          }
          if (msg.method === "Network.loadingFailed") {
            failedRequests.push(`${msg.params.type}: ${msg.params.errorText}`);
          }
          if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) {
            failedRequests.push(`${msg.params.response.status} ${msg.params.response.url}`);
          }
        });

        await s.send("Page.enable");
        await s.send("Runtime.enable");
        await s.send("Network.enable");
        /*
          Every route measured as a FIRST visit. Without this, Chrome reuses
          its cache across tabs and every route after the first reports a
          fraction of its real weight — 14 KB for a page that costs 1 MB cold.
        */
        await s.send("Network.setCacheDisabled", { cacheDisabled: true });

        /*
          LCP has to be observed, not queried: by the time the page has
          loaded, `getEntriesByType('largest-contentful-paint')` returns
          nothing. This runs before any page script on every navigation.
        */
        await s.send("Page.addScriptToEvaluateOnNewDocument", {
          source: `
            window.__lcp = null;
            try {
              new PerformanceObserver((list) => {
                const last = list.getEntries().pop();
                if (last) window.__lcp = Math.round(last.startTime);
              }).observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) { /* unsupported — reported as "—" */ }
          `,
        });
        await s.send("Emulation.setDeviceMetricsOverride", {
          width: size.w, height: size.h, deviceScaleFactor: 1, mobile: size.w < 600,
        });

        const loaded = new Promise((resolve) => {
          s.on((msg) => { if (msg.method === "Page.loadEventFired") resolve(); });
          setTimeout(resolve, 20000);
        });
        await s.send("Page.navigate", { url });
        await loaded;

        /*
          Settle before measuring or scrolling. Images and webfonts land after
          `load` and they GROW the document — scrolling too early clamps to a
          height the page has already outgrown, and the screenshot lands
          somewhere other than where it was asked to.
        */
        await s.send("Runtime.evaluate", {
          awaitPromise: true,
          expression: `(async () => {
            if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
            const pending = Array.from(document.images).filter((i) => !i.complete);
            await Promise.all(pending.map((i) => new Promise((res) => {
              i.addEventListener('load', res, { once: true });
              i.addEventListener('error', res, { once: true });
              setTimeout(res, 4000);
            })));
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          })()`,
        }).catch(() => {});
        await new Promise((r) => setTimeout(r, 400));

        const { result } = await s.send("Runtime.evaluate", { expression: PROBE, returnByValue: true });
        const probe = result.value;

        if (scroll > 0) {
          const { result: scrolled } = await s.send("Runtime.evaluate", {
            expression: `(() => {
              window.scrollTo(0, ${scroll});
              return { asked: ${scroll}, at: Math.round(window.scrollY), height: document.documentElement.scrollHeight };
            })()`,
            returnByValue: true,
          });
          const at = scrolled.value;
          if (Math.abs(at.at - at.asked) > 4) {
            console.log(`  note: asked for ${at.asked}px, page allows ${at.at}px (document is ${at.height}px tall)`);
          }
          await new Promise((r) => setTimeout(r, 300));
        }

        const shot = await s.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: !fold,
        });
        const suffix = scroll > 0 ? `@${size.label}+${scroll}` : `@${size.label}${fold ? "-fold" : ""}`;
        const name = `${route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "")}${suffix}.png`;
        writeFileSync(join(outDir, name), Buffer.from(shot.data, "base64"));

        /* ------------------------------------------------------- verdicts */
        const problems = [];
        if (probe.sheets === 0) problems.push("NO STYLESHEET ATTACHED");
        if (!probe.accentToken) problems.push("globals.css tokens missing (--accent empty)");
        if (probe.panelBackground && probe.panelBackground === "rgba(0, 0, 0, 0)") {
          problems.push(".panel has no background — CSS loaded but did not apply");
        }
        if (probe.scrollWidth > probe.clientWidth + 1) {
          problems.push(`horizontal overflow: ${probe.scrollWidth}px in ${probe.clientWidth}px`);
        }
        if (probe.imagesBroken.length > 0) {
          problems.push(`broken images: ${probe.imagesBroken.slice(0, 3).join(", ")}`);
        }
        const cssFailures = failedRequests.filter((f) => /Stylesheet|\.css/i.test(f));
        if (cssFailures.length > 0) problems.push(`stylesheet request failed: ${cssFailures[0]}`);
        if (consoleErrors.length > 0) problems.push(`console: ${consoleErrors[0]}`);
        const other = failedRequests.filter((f) => !cssFailures.includes(f));
        if (other.length > 0) problems.push(`failed request: ${other[0]}`);

        /*
          A budget, not a benchmark. The point is to notice the day someone
          drops a 4 MB hero image in, not to replace Lighthouse.
        */
        if (probe.perf.kb > 1600) problems.push(`page weight ${probe.perf.kb} KB (budget 1600)`);
        if (probe.perf.requests > 80) problems.push(`${probe.perf.requests} requests (budget 80)`);

        rows.push({
          route, viewport: size.label, shot: name,
          sheets: probe.sheets, accent: probe.accentToken || "—",
          panel: probe.panelBackground ?? "—",
          width: `${probe.scrollWidth}/${probe.clientWidth}`,
          perf: probe.perf,
          cookies: probe.cookies,
          thirdParty: probe.thirdParty,
          problems,
        });
        if (problems.length > 0) failures.push(`${route} @ ${size.label}: ${problems.join(" · ")}`);

        s.close();
        await fetchJson(`${endpoint}/json/close/${target.id}`).catch(() => {});
      }
    }
  } finally {
    proc.kill();
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  /* --------------------------------------------------------------- report */
  console.log("");
  console.log("route                                viewport    css  --accent   KB   reqs  LCP     cookies");
  for (const r of rows) {
    console.log(
      `${r.route.padEnd(36)} ${r.viewport.padEnd(11)} ${String(r.sheets).padEnd(4)} ` +
      `${r.accent.padEnd(10)} ${String(r.perf.kb).padEnd(4)} ${String(r.perf.requests).padEnd(5)} ` +
      `${String(r.perf.lcp ?? "—").padEnd(7)} ${String(r.cookies)}${r.problems.length ? "  ⚠" : ""}`,
    );
  }

  const origins = [...new Set(rows.flatMap((r) => r.thirdParty))];
  const cookied = rows.filter((r) => r.cookies > 0);
  console.log("");
  console.log(`third-party origins: ${origins.length > 0 ? origins.join(", ") : "none"}`);
  console.log(
    `cookies set: ${cookied.length > 0 ? cookied.map((r) => r.route).join(", ") : "none — no consent banner required"}`,
  );
  console.log(`screenshots → ${outDir}/`);

  if (failures.length > 0) {
    console.log("");
    console.log("FAILURES");
    for (const f of failures) console.log(`  · ${f}`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
