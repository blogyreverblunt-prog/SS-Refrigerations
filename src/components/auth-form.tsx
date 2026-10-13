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

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
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
          phone: String(data.get("phone") ?? "") || undefined,
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
            <label htmlFor={`${uid}-phone`}>Phone <span className="muted">(optional)</span></label>
            <input
              className="field"
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              aria-invalid={Boolean(issueFor("phone"))}
            />
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
