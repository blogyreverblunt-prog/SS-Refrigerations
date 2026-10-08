"use client";

/**
 * The conversion event. Posts to POST /api/leads — the one hot write
 * endpoint — and renders whatever the server says.
 *
 * Three things it deliberately does:
 *
 *  1. Sends an `Idempotency-Key` generated ONCE per mounted form. A
 *     double-click, a flaky network retry and an impatient second tap all
 *     carry the same key, and the server collapses them to one lead via the
 *     partial unique index. Only a successful submit rotates the key.
 *
 *  2. Renders the server's field-level validation issues against the fields
 *     themselves. The server is the only validator that matters, so the
 *     client does not duplicate those rules and cannot drift from them.
 *
 *  3. Carries the honeypot input. Off-screen, `tabIndex={-1}`,
 *     `autoComplete="off"` — invisible to a person, irresistible to a naive
 *     bot, and silently discarded server-side.
 */
import { useId, useRef, useState } from "react";

import { ArrowRight } from "./icons";

interface Issue {
  path: string;
  message: string;
}

interface Props {
  /** Pre-selects the enquiry on a product page. */
  modelContext?: { productId: string; name: string } | undefined;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; ref: string; duplicate: boolean }
  | { kind: "failed"; message: string; issues: Issue[] };

export function EnquiryForm({ modelContext }: Props) {
  const uid = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Stable for the life of this form instance; rotated only after success.
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const issueFor = (field: string) =>
    status.kind === "failed" ? status.issues.find((i) => i.path === field)?.message : undefined;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus({ kind: "sending" });

    const payload = {
      type: modelContext ? "rfq" : "contact",
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? "") || undefined,
      company: String(data.get("company") ?? "") || undefined,
      city: String(data.get("city") ?? "") || undefined,
      message: String(data.get("message") ?? "") || undefined,
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
      items: modelContext ? [{ productId: modelContext.productId, qty: 1 }] : [],
      source: { landingPath: window.location.pathname },
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey.current,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as {
        ref?: string;
        duplicate?: boolean;
        error?: { message?: string; issues?: Issue[] };
      };

      if (!res.ok) {
        setStatus({
          kind: "failed",
          message: body.error?.message ?? "We could not send that. Please try again.",
          issues: body.error?.issues ?? [],
        });
        return;
      }

      setStatus({ kind: "sent", ref: body.ref ?? "", duplicate: Boolean(body.duplicate) });
      form.reset();
      idempotencyKey.current = crypto.randomUUID();
    } catch {
      setStatus({
        kind: "failed",
        message: "Network error — please check your connection and try again.",
        issues: [],
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="notice notice--ok" role="status">
        <strong>Thank you — your enquiry has reached us.</strong>
        Your reference is <strong style={{ display: "inline" }}>{status.ref}</strong>. A member
        of our team will be in touch shortly.
        {status.duplicate && (
          <div style={{ marginTop: "var(--s-2)" }}>
            (We already had this one — no duplicate was created.)
          </div>
        )}
      </div>
    );
  }

  const busy = status.kind === "sending";

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

      {modelContext && (
        <div className="chips">
          <span className="chip chip--accent">Enquiring about: {modelContext.name}</span>
        </div>
      )}

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-name`}>Name</label>
          <input className="field" id={`${uid}-name`} name="name" autoComplete="name"
                 aria-invalid={Boolean(issueFor("name"))} required />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-email`}>Email</label>
          <input className="field" id={`${uid}-email`} name="email" type="email"
                 autoComplete="email" aria-invalid={Boolean(issueFor("email"))} required />
        </div>
      </div>

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-phone`}>Phone</label>
          <input className="field" id={`${uid}-phone`} name="phone" type="tel"
                 autoComplete="tel" placeholder="9876543210"
                 aria-invalid={Boolean(issueFor("phone"))} />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-city`}>City</label>
          <input className="field" id={`${uid}-city`} name="city" autoComplete="address-level2" />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input className="field" id={`${uid}-company`} name="company" autoComplete="organization" />
      </div>

      <div className="field-group">
        <label htmlFor={`${uid}-message`}>What do you need?</label>
        <textarea className="field" id={`${uid}-message`} name="message"
                  placeholder="Model, quantity, site and timeline if you have them." />
      </div>

      {/* Honeypot. Never shown, never tabbable, never autofilled. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="consent" htmlFor={`${uid}-consent`}>
        <input id={`${uid}-consent`} name="consent" type="checkbox" required />
        <span>
          I agree to KALT storing these details in order to respond to this enquiry.
          {issueFor("consent") && (
            <strong style={{ color: "var(--danger)", display: "block" }}>
              {issueFor("consent")}
            </strong>
          )}
        </span>
      </label>

      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send enquiry"} {!busy && <ArrowRight />}
      </button>
    </form>
  );
}
