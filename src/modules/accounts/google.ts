/**
 * Sign in with Google — the OAuth 2.0 authorization-code flow, by hand.
 *
 * ## Why not next-auth
 *
 * This module is about 120 lines and adds no dependency. Auth.js would add
 * one with its own session model, its own cookie and its own database
 * adapter, and this codebase already has all three: sessions are rows in
 * `customer_session`, the cookie is `kalt_session`, and the repository owns
 * the writes. Adopting a second session system to gain one button is how a
 * codebase ends up with two ways to be signed in and a bug where one of them
 * does not log you out.
 *
 * ## What is verified, and what is taken on trust
 *
 * The `id_token` is NOT signature-verified here, and that is deliberate
 * rather than an omission. It is read from the response to a direct,
 * server-to-server HTTPS POST to accounts.google.com, authenticated with the
 * client secret — the token never passes through the browser. Google's own
 * documentation says verification may be skipped in exactly this case,
 * because TLS plus the client secret already establish who sent it. The
 * signature check matters when a token arrives from somewhere less trusted,
 * which in this flow it never does.
 *
 * What IS checked: `state`, against a cookie set before the redirect, which
 * is what stops a CSRF-style login forgery; and `email_verified`, before the
 * address is ever used to match an existing account.
 *
 * ## PKCE
 *
 * Included even though a confidential client with a secret does not strictly
 * need it. It costs one hash and removes the entire class of attack where an
 * authorization code is intercepted and replayed.
 */
import { createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/**
 * The three cookies that carry the handshake across the redirect.
 *
 * They live here rather than in the route that sets them because a Next route
 * module may only export its handlers and a fixed set of config names —
 * exporting a constant from one is a build error, and the callback route needs
 * these names too.
 */
export const G_STATE_COOKIE = "g_state";
export const G_VERIFIER_COOKIE = "g_verifier";
export const G_NEXT_COOKIE = "g_next";
/** Longer than anyone takes to choose an account, short enough to leave nothing. */
export const G_HANDSHAKE_TTL_SECONDS = 10 * 60;

/** Everything the callback needs to carry across the redirect. */
export interface GoogleHandshake {
  readonly url: string;
  readonly state: string;
  readonly codeVerifier: string;
}

/** The subset of Google's profile this site stores. */
export interface GoogleProfile {
  /** Immutable subject id. The only value safe to key an identity on. */
  readonly sub: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly name: string;
  readonly picture: string | null;
}

export function googleRedirectUri(): string {
  return `${env.APP_URL.replace(/\/$/, "")}/api/auth/google/callback`;
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

/**
 * Builds the URL to send the browser to, plus the two values that have to
 * survive the round trip in cookies.
 */
export function startGoogleSignIn(): GoogleHandshake {
  const state = base64url(randomBytes(32));
  const codeVerifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(codeVerifier).digest());

  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  // openid gets the sub; the other two get the name, picture and address.
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  // No refresh token: this site asks Google who you are once, at sign-in,
  // and never calls a Google API on your behalf afterwards.
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return { url: url.toString(), state, codeVerifier };
}

export class GoogleAuthError extends Error {}

/**
 * Exchanges the one-time code for the profile. Server to server; the code is
 * spent here and is useless to anyone who sees it afterwards.
 */
export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
): Promise<GoogleProfile> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    // Google's body here names the misconfiguration — redirect_uri_mismatch
    // being the usual one — and it must reach the log without reaching the
    // visitor, who can do nothing with it.
    throw new GoogleAuthError(
      `token exchange failed: ${response.status} ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { id_token?: string };
  if (!body.id_token) throw new GoogleAuthError("no id_token in token response");

  return readIdToken(body.id_token);
}

/**
 * Decodes the JWT payload. See the header for why the signature is not
 * checked: this token arrived over TLS from Google's token endpoint, in
 * response to a request carrying the client secret.
 */
function readIdToken(idToken: string): GoogleProfile {
  const segment = idToken.split(".")[1];
  if (!segment) throw new GoogleAuthError("malformed id_token");

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    throw new GoogleAuthError("id_token payload is not JSON");
  }

  const sub = typeof claims.sub === "string" ? claims.sub : "";
  const email = typeof claims.email === "string" ? claims.email.toLowerCase() : "";
  if (!sub || !email) throw new GoogleAuthError("id_token is missing sub or email");

  // Google sends this as a boolean, and has historically sent the string
  // "true" as well. Both are accepted; anything else is not verified.
  const verified = claims.email_verified;
  const emailVerified = verified === true || verified === "true";

  const name =
    typeof claims.name === "string" && claims.name.trim()
      ? claims.name.trim()
      : // Someone with no display name still needs one; the local part is a
        // better placeholder than an empty string in the header.
        (email.split("@")[0] ?? "Customer");

  const picture = typeof claims.picture === "string" ? claims.picture : null;

  return { sub, email, emailVerified, name, picture };
}
