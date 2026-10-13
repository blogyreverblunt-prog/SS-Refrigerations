/**
 * Password hashing, on the standard library.
 *
 * scrypt from `node:crypto` rather than bcrypt or argon2, and the reason is
 * deployment rather than cryptography: both of those are native modules that
 * have to be compiled for the runtime they land on, and this app ships to a
 * serverless platform where a postinstall build step is the thing most likely
 * to break on a Tuesday. scrypt is memory-hard, is in the standard library of
 * every Node this will ever run on, and needs no install.
 *
 * The cost parameters are encoded INTO the stored string, not read from a
 * constant at verify time. That is what makes them raisable later: a hash
 * written at N=16384 keeps verifying after the constant moves, and the
 * rewrite can happen on next login rather than in a migration that cannot
 * read anybody's password anyway.
 *
 * Nothing here is reachable from the Edge runtime — `node:crypto`'s scrypt is
 * not in that subset — so every route that touches it declares
 * `runtime = "nodejs"`.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * N=16384, r=8, p=1 — about 16 MB and a few milliseconds per hash.
 *
 * `maxmem` has to be raised with N: the default 32 MB ceiling is computed as
 * 128 * N * r plus overhead, and scrypt throws rather than degrading when it
 * is exceeded. 64 MB leaves room to double N without editing two numbers.
 */
const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** `scrypt$N$r$p$salt$hash`, both tails base64. Self-describing on purpose. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(normalise(plain), salt, KEY_LENGTH, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

/**
 * Constant-time, and false rather than throwing on a malformed stored value.
 *
 * A row whose hash cannot be parsed is a failed login, not a 500: the one
 * thing worse than rejecting a valid password is handing an attacker a
 * different response for "this account exists but its hash is broken".
 */
export async function verifyPassword(plain: string, encoded: string): Promise<boolean> {
  const [scheme, nRaw, rRaw, pRaw, saltRaw, hashRaw] = encoded.split("$");
  if (scheme !== "scrypt" || !nRaw || !rRaw || !pRaw || !saltRaw || !hashRaw) return false;

  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltRaw, "base64");
    expected = Buffer.from(hashRaw, "base64");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const key = await scrypt(normalise(plain), salt, expected.length, {
      N,
      r,
      p,
      maxmem: Math.max(PARAMS.maxmem, 128 * N * r * 2),
    });
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** True when a stored hash was written with weaker parameters than we now use. */
export function needsRehash(encoded: string): boolean {
  const [scheme, nRaw] = encoded.split("$");
  if (scheme !== "scrypt" || !nRaw) return true;
  return Number(nRaw) < PARAMS.N;
}

/**
 * Unicode normalisation before hashing.
 *
 * A password typed on an iPhone and the same password typed on a ThinkPad
 * can be different byte sequences for identical-looking characters — an
 * accented letter composed one way or two. NFKC collapses that, so somebody
 * who registers on one device can still sign in on the other.
 */
function normalise(plain: string): string {
  return plain.normalize("NFKC");
}
