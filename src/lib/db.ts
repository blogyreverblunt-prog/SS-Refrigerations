/**
 * db.ts — Drizzle over Neon.  Seam 4.
 *
 * TWO DRIVERS, ON PURPOSE.
 *
 *   reads / single writes  →  neon-http      (one HTTP round trip, no session)
 *   transactions           →  neon-serverless (WebSocket, real session)
 *
 * The HTTP driver is the right default: no connection to leak between
 * serverless invocations and cold starts measured in milliseconds, which
 * matters because Neon is cold-starting at the same moment. But it is
 * stateless, so it genuinely cannot do an interactive transaction —
 * `drizzle-orm/neon-http` throws "No transactions support in neon-http
 * driver" if you try.
 *
 * That is unacceptable for the one path that must not break: HLD.md §6.1
 * requires `INSERT lead + INSERT lead_item[] + INSERT outbox` to commit
 * atomically, because that co-commit IS the durability boundary. So writes
 * that need atomicity open a short-lived pooled session and close it again.
 *
 * At ~80 leads a day the cost of a WebSocket per enquiry is irrelevant; the
 * cost of a half-written lead is not.
 */
import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePool, type NeonDatabase } from "drizzle-orm/neon-serverless";

import * as schema from "@/db/schema";
import { env } from "./env";

/**
 * The pooled driver needs a WebSocket implementation. Node 22+ ships one
 * globally; older runtimes need the `ws` polyfill. Resolved once, here, so
 * no call site has to care which runtime it is on.
 */
if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

export type Database = ReturnType<typeof createHttpClient>;

/**
 * A handle that can run queries: the database itself, or a transaction.
 * Repositories accept this so the SAME method works inside and outside a
 * transaction, which is what lets the caller — not the repository — decide
 * what is atomic.
 */
export type Executor = Parameters<
  Parameters<NeonDatabase<typeof schema>["transaction"]>[0]
>[0];

function createHttpClient(connectionString: string) {
  return drizzleHttp(neon(connectionString), { schema, casing: "snake_case" });
}

/* -------------------------------------------------------------------------
 * Lazy singletons — built on first use, never at import time, so `next build`
 * works on a machine with no DATABASE_URL.
 * ---------------------------------------------------------------------- */

let primary: Database | null = null;
let replica: Database | null = null;

/** Read/write, non-transactional. */
export function db(): Database {
  primary ??= createHttpClient(env.DATABASE_URL);
  return primary;
}

/**
 * Reads. Returns the primary until DATABASE_URL_RO is set, at which point
 * every caller is transparently routed to the replica — that is seam 5 in
 * its entirety, and no call site changes.
 */
export function dbRead(): Database {
  if (env.DATABASE_URL_RO) {
    replica ??= createHttpClient(env.DATABASE_URL_RO);
    return replica;
  }
  return db();
}

/**
 * Run work inside ONE transaction. The durability boundary.
 *
 * A Pool is created and destroyed per call rather than kept warm. In a
 * serverless runtime a module-scope pool outlives the invocation that made
 * it and leaks sockets on a frozen instance; the connect cost is a few
 * milliseconds and the write volume here is tiny, so correctness wins.
 *
 * `finally` closes the pool on the failure path too — otherwise a rolled-back
 * transaction would be the thing that exhausts the connection limit.
 */
export async function withTransaction<T>(
  fn: (tx: Executor) => Promise<T>,
): Promise<T> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    const client = drizzlePool(pool, { schema, casing: "snake_case" });
    return await client.transaction(fn);
  } finally {
    await pool.end().catch(() => {
      /* closing a pool must never mask the real error */
    });
  }
}

/** Drop cached clients. Test seam, and used after an env change. */
export function resetDbClients(): void {
  primary = null;
  replica = null;
}

export { schema };
