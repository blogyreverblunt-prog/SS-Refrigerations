"use client";

/**
 * Service request — the support-side twin of EnquiryForm.
 *
 * The field set is lifted from Elanpro's complaint registration form, because
 * it is what an Indian service desk actually opens a ticket with: model code,
 * serial number, purchase date, warranty status, invoice number and the
 * channel the caller wants to be reached on
 * (docs/ia/PURE-PLAY-BENCHMARK.md §3.8).
 *
 * Those fields do not have columns. `lead.source` is `.strip()`-ed to five
 * known attribution keys, so inventing keys there would silently drop them —
 * instead they are composed into `message` as labelled lines. The desk reads
 * one block of text that already contains everything it would otherwise ring
 * back to ask for, and no migration was needed to ship it.
 *
 * Mechanics (idempotency key, honeypot, server-rendered field issues) are the
 * same as EnquiryForm's and for the same reasons.
 */
import { useId, useRef, useState } from "react";

import { ArrowRight } from "./icons";
import { TURNSTILE_FIELD, TurnstileWidget, resetTurnstile } from "./turnstile";

interface Issue {
  path: string;
  message: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; ref: string; duplicate: boolean }
  | { kind: "failed"; message: string; issues: Issue[] };

/** Labelled lines, so the desk can read the ticket without a schema. */
function composeMessage(data: FormData): string {
  const lines: string[] = [];
  const add = (label: string, key: string) => {
    const value = String(data.get(key) ?? "").trim();
    if (value) lines.push(`${label}: ${value}`);
  };

  add("Model code", "modelCode");
  add("Serial number", "serialNo");
  add("Purchase date", "purchasedOn");
  add("Warranty status", "warrantyStatus");
  add("Invoice number", "invoiceNo");
  add("Purchased from", "purchasedFrom");
  add("Preferred contact", "preferredContact");
  add("Site address", "siteAddress");

  const issue = String(data.get("issue") ?? "").trim();
  if (issue) lines.push("", "Issue:", issue);

  return lines.join("\n");
}

interface Props {
  /** Turnstile site key, passed down from the server component. */
  turnstileSiteKey?: string | undefined;
}

export function ServiceRequestForm({ turnstileSiteKey }: Props = {}) {
  const uid = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const issueFor = (field: string) =>
    status.kind === "failed" ? status.issues.find((i) => i.path === field)?.message : undefined;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus({ kind: "sending" });

    const payload = {
      type: "support",
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? "") || undefined,
      company: String(data.get("company") ?? "") || undefined,
      city: String(data.get("city") ?? "") || undefined,
      message: composeMessage(data),
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
      captchaToken: String(data.get(TURNSTILE_FIELD) ?? "") || undefined,
      items: [],
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
        resetTurnstile();
        setStatus({
          kind: "failed",
          message: body.error?.message ?? "We could not log that. Please call the helpline.",
          issues: body.error?.issues ?? [],
        });
        return;
      }

      setStatus({ kind: "sent", ref: body.ref ?? "", duplicate: Boolean(body.duplicate) });
      form.reset();
      resetTurnstile();
      idempotencyKey.current = crypto.randomUUID();
    } catch {
      setStatus({
        kind: "failed",
        message: "Network error — please check your connection, or call the helpline.",
        issues: [],
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="notice notice--ok" role="status">
        <strong>Service request logged.</strong>
        Your ticket reference is{" "}
        <strong style={{ display: "inline" }}>{status.ref}</strong>. Keep it for the
        callback — an engineer will be assigned and you will hear from us on the
        channel you chose.
        {status.duplicate && (
          <div style={{ marginTop: "var(--s-2)" }}>
            (We already had this one — no duplicate ticket was raised.)
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

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-name`}>Name</label>
          <input className="field" id={`${uid}-name`} name="name" autoComplete="name"
                 aria-invalid={Boolean(issueFor("name"))} required />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-phone`}>Phone</label>
          <input className="field" id={`${uid}-phone`} name="phone" type="tel"
                 autoComplete="tel" placeholder="9876543210"
                 aria-invalid={Boolean(issueFor("phone"))} required />
        </div>
      </div>

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-email`}>Email</label>
          <input className="field" id={`${uid}-email`} name="email" type="email"
                 autoComplete="email" aria-invalid={Boolean(issueFor("email"))} required />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-company`}>Business name</label>
          <input className="field" id={`${uid}-company`} name="company" autoComplete="organization" />
        </div>
      </div>

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-model`}>Model code</label>
          <input className="field" id={`${uid}-model`} name="modelCode" placeholder="HR-78MA-S" />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-serial`}>Serial number</label>
          <input className="field" id={`${uid}-serial`} name="serialNo"
                 placeholder="On the plate inside the door" />
        </div>
      </div>

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-purchased`}>Date of purchase</label>
          <input className="field" id={`${uid}-purchased`} name="purchasedOn" type="date" />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-warranty`}>Warranty status</label>
          <select className="field" id={`${uid}-warranty`} name="warrantyStatus"
                  defaultValue="Not sure">
            <option>In warranty</option>
            <option>Out of warranty</option>
            <option>Under AMC</option>
            <option>Not sure</option>
          </select>
        </div>
      </div>

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-invoice`}>Invoice number</label>
          <input className="field" id={`${uid}-invoice`} name="invoiceNo" />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-from`}>Purchased from</label>
          <select className="field" id={`${uid}-from`} name="purchasedFrom" defaultValue="Direct">
            <option>Direct</option>
            <option>Dealer / distributor</option>
            <option>Online store</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div className="form__row">
        <div className="field-group">
          <label htmlFor={`${uid}-city`}>City</label>
          <input className="field" id={`${uid}-city`} name="city" autoComplete="address-level2" />
        </div>
        <div className="field-group">
          <label htmlFor={`${uid}-contact`}>Preferred contact</label>
          <select className="field" id={`${uid}-contact`} name="preferredContact"
                  defaultValue="Phone call">
            <option>Phone call</option>
            <option>WhatsApp</option>
            <option>Email</option>
          </select>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor={`${uid}-site`}>Site address</label>
        <input className="field" id={`${uid}-site`} name="siteAddress"
               placeholder="Where the cabinet is installed" />
      </div>

      <div className="field-group">
        <label htmlFor={`${uid}-issue`}>What is happening?</label>
        <textarea className="field" id={`${uid}-issue`} name="issue" required
                  placeholder="Not cooling below 12 °C since Monday, compressor runs continuously, no ice on the coil." />
      </div>

      {/* Honeypot. Never shown, never tabbable, never autofilled. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="consent" htmlFor={`${uid}-consent`}>
        <input id={`${uid}-consent`} name="consent" type="checkbox" required />
        <span>
          I agree to these details being stored in order to attend to this service
          request.
          {issueFor("consent") && (
            <strong style={{ color: "var(--danger)", display: "block" }}>
              {issueFor("consent")}
            </strong>
          )}
        </span>
      </label>

      <TurnstileWidget siteKey={turnstileSiteKey} />

      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Logging…" : "Log service request"} {!busy && <ArrowRight />}
      </button>
    </form>
  );
}
