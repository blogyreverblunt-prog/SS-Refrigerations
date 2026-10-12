/**
 * guard-dev.mjs — refuse to start a second dev server.
 *
 * Next's helpfulness is the trap: if port 3000 is taken, `next dev` prints a
 * one-line notice and quietly starts on 3001 instead. Both processes then
 * compile into the SAME `.next` directory, and the second one overwrites the
 * chunks the first one is still serving. The server on :3000 goes on
 * returning complete HTML that references a stylesheet which no longer
 * exists — every route 200, the whole site unstyled, and nothing in either
 * terminal saying anything is wrong.
 *
 * That is not hypothetical: it happened in this repo on 2026-10-10 and cost
 * an hour of looking for a CSS bug that did not exist.
 *
 * The check CONNECTS rather than binds. Binding a probe socket is the
 * obvious implementation and it does not work here: Next listens on `::`
 * (IPv6 any) and Windows still allows a separate bind on `0.0.0.0`, so the
 * probe succeeds while the port is very much in use. Dialling the port is
 * unambiguous — if something answers, something is there.
 *
 * Deliberately starting a second one:
 *
 *   $env:SKIP_DEV_GUARD=1; npm run dev     # shares .next — expect breakage
 *
 * If you genuinely need two at once, give the second its own build directory
 * (`distDir`), because the collision is `.next`, not the port.
 */
import { connect } from "node:net";

const port = Number(process.env.PORT ?? 3000);

if (process.env.SKIP_DEV_GUARD === "1") {
  console.log(`[guard-dev] SKIP_DEV_GUARD=1 — not checking port ${port}.`);
  process.exit(0);
}

/** Resolves true if anything accepts a connection on host:port. */
function isListening(host) {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    const done = (answer) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(answer);
    };
    socket.setTimeout(1500);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

const [v4, v6] = await Promise.all([isListening("127.0.0.1"), isListening("::1")]);

if (!v4 && !v6) {
  process.exit(0);
}

console.error("");
console.error(`  A server is already listening on port ${port}.`);
console.error("");
console.error("  Starting another `next dev` now would NOT fail — it would quietly take");
console.error(`  port ${port + 1} and keep compiling into the same .next directory,`);
console.error("  overwriting the chunks the first server is serving. The symptom is a");
console.error("  site that returns 200 everywhere and renders with no CSS at all.");
console.error("");
console.error("  Use the server that is already running, or stop it first:");
console.error("");
console.error(`    Get-NetTCPConnection -LocalPort ${port} -State Listen |`);
console.error("      ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }");
console.error("    Remove-Item -Recurse -Force .next");
console.error("    npm run dev");
console.error("");
console.error("  To start one anyway: $env:SKIP_DEV_GUARD=1; npm run dev");
console.error("");
process.exit(1);
