"use client";

/**
 * Sign in and register, which are the same form with two labels and two
 * endpoints — so they are one component. Splitting them duplicates the
 * issue-rendering and the redirect, and the two copies drift.
 *
 * It follows the enquiry form's contract deliberately: the server is the only
 * validator, its field-level issues are rendered against the fields
 * themselves, and the client repeats none of those rules so it cannot
 * disagree with them.
 *
 * On success it navigates with `window.location.assign` rather than the
 * router. The session cookie arrives on the response to this fetch, and a
 * client-side transition would render the next page from a cache fetched
 * while nobody was signed in — the account page would say "not signed in"
 * one millisecond after signing in.
 */
import { useId, useState } from "react";

import { ArrowRight } from "./icons";

interface Issue {
  path: string;
  message: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "failed"; message: string; issues: Issue[] };

/**
 * Google's mark, inline.
 *
 * Their brand guidelines require the four-colour "G" at its own colours, so
 * this one icon does not take `currentColor` like every other icon on the
 * site. Drawing it in the site's ink instead would be both wrong and against
 * the terms of using the button.
 */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.9H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5Z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3Z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6Z" />
    </svg>
  );
}

export function AuthForm({
  mode,
  next,
  google = false,
}: {
  mode: "login" | "register";
  next?: string;
  /** Renders the provider button. False when the server has no credentials. */
  google?: boolean;
}) {
  const uid = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const registering = mode === "register";
  const endpoint = registering ? "/api/auth/register" : "/api/auth/login";

  const issueFor = (field: string) =>
    status.kind === "failed" ? status.issues.find((i) => i.path === field)?.message : undefined;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus({ kind: "sending" });

    const payload = registering
      ? {
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
          // Required now, so it is sent as typed and the server decides.
          phone: String(data.get("phone") ?? ""),
          company: String(data.get("company") ?? "") || undefined,
          website: String(data.get("website") ?? ""),
        }
      : {
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string; issues?: Issue[] };
        };
        setStatus({
          kind: "failed",
          message:
            body.error?.message ??
            (registering ? "We could not create that account." : "We could not sign you in."),
          issues: body.error?.issues ?? [],
        });
        return;
      }

      window.location.assign(next && next.startsWith("/") ? next : "/account");
    } catch {
      setStatus({
        kind: "failed",
        message: "Network error — please check your connection and try again.",
        issues: [],
      });
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {/*
        Google first, then the rule, then the form. The provider button goes
        above because somebody who has one wants it immediately, and because a
        button placed under a password field reads as an afterthought.

        It is an <a>, not a fetch: /api/auth/google is a redirect to another
        origin, so the browser has to navigate. `next` rides along in the
        query string and is re-checked server-side before it is used.
      */}
      {google && (
        <>
          <a
            className="btn btn--ghost btn--block btn--provider"
            href={`/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          >
            <GoogleMark />
            {registering ? "Sign up with Google" : "Continue with Google"}
          </a>
          <p className="or-rule">or</p>
        </>
      )}

      {status.kind === "failed" && (
        <div className="notice notice--err" role="alert">
          <strong>{status.message}</strong>
          {status.issues.length > 0 && (
            <ul>
              {status.issues.map((i) => (
                <li key={i.path}>• {i.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {registering && (
        <div className="form__row">
          <div className="field-group">
            <label htmlFor={`${uid}-name`}>Name</label>
            <input
              className="field"
              id={`${uid}-name`}
              name="name"
              autoComplete="name"
              aria-invalid={Boolean(issueFor("name"))}
              required
            />
            {issueFor("name") && (
              <strong style={{ color: "var(--danger)", fontSize: "var(--fs-xs)" }}>
                {issueFor("name")}
              </strong>
            )}
          </div>
          <div className="field-group">
            <label htmlFor={`${uid}-company`}>Company <span className="muted">(optional)</span></label>
            <input
              className="field"
              id={`${uid}-company`}
              name="company"
              autoComplete="organization"
            />
          </div>
        </div>
      )}

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-email`}>Email</label>
          <input
            className="field"
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(issueFor("email"))}
            required
          />
          {issueFor("email") && (
              <strong style={{ color: "var(--danger)", fontSize: "var(--fs-xs)" }}>
                {issueFor("email")}
              </strong>
            )}
        </div>
        {registering && (
          <div className="field-group">
            <label htmlFor={`${uid}-phone`}>Contact number</label>
            {/*
              The country code is shown, not typed. India is the whole market
              today, so a selector would be several decisions with one likely
              answer — and the server still accepts a full +<code> number, so
              somebody abroad who types one is not turned away.
            */}
            <div className="input-group">
              <span className="input-group__prefix">+91</span>
              <input
                className="field"
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                aria-invalid={Boolean(issueFor("phone"))}
                required
              />
            </div>
            {issueFor("phone") && (
              <strong style={{ color: "var(--danger)", fontSize: "var(--fs-xs)" }}>
                {issueFor("phone")}
              </strong>
            )}
          </div>
        )}
      </div>

      <div className="field-group">
        <label htmlFor={`${uid}-password`}>Password</label>
        <input
          className="field"
          id={`${uid}-password`}
          name="password"
          type="password"
          /* Tells a password manager which of the two this is, so it offers to
             save on one and to fill on the other. */
          autoComplete={registering ? "new-password" : "current-password"}
          aria-invalid={Boolean(issueFor("password"))}
          required
        />
        {issueFor("password") ? (
          <strong style={{ color: "var(--danger)", fontSize: "var(--fs-xs)" }}>
            {issueFor("password")}
          </strong>
        ) : registering ? (
          <p className="small">
            At least 12 characters. A short phrase you will remember beats a short word
            with a symbol in it.
          </p>
        ) : null}
      </div>

      {registering && (
        /* Honeypot. Off-screen and untabbable: invisible to a person, filled
           by a naive bot, discarded server-side. */
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
          <label htmlFor={`${uid}-website`}>Website</label>
          <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>
      )}

      <button className="btn btn--primary" type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending"
          ? registering
            ? "Creating account…"
            : "Signing in…"
          : registering
            ? "Create account"
            : "Sign in"}
        <ArrowRight />
      </button>
    </form>
  );
}
