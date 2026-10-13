/**
 * The account page — the one route on this site that reads a cookie.
 *
 * `force-dynamic` is deliberate and contained. HLD.md's rule is that pages
 * read the database at build or revalidation and never per visitor; this page
 * is the documented exception, because "your account" cannot be prerendered
 * for a person the build does not know about. Every other route stays static,
 * which is why the header asks /api/auth/me from the browser instead of
 * reading the cookie server-side and dragging the whole site dynamic with it.
 *
 * Signed out, this is not an error and not a redirect — it is a page that
 * says what an account is for and offers the two links.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { PageHero, PageSection } from "@/components/page-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { site } from "@/content/site";
import { container } from "@/lib/container";
import { SESSION_COOKIE } from "@/modules/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const customer = await container.accountService().current(token);

  if (!customer) {
    return (
      <>
        <PageHero
          eyebrow="Account"
          title="You are not signed in."
          lead="Which is fine — nothing on this site needs an account. One is only needed when you come to pay."
        />
        <PageSection bare>
          <div className="phero__actions">
            <Link className="btn btn--primary" href="/login">
              Sign in
            </Link>
            <Link className="btn btn--ghost" href="/register">
              Create an account
            </Link>
          </div>
        </PageSection>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Account"
        title={`Hello, ${customer.name}.`}
        lead="Your details as we hold them. Payments and order history arrive with checkout."
      />

      <PageSection eyebrow="Your details" title="What we have on file.">
        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Name</span>
            <span className="rows__v">{customer.name}</span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Email</span>
            <span className="rows__v">
              {customer.email}
              {!customer.emailVerifiedAt && (
                <span className="muted"> · not verified yet</span>
              )}
            </span>
          </div>
          {customer.phone && (
            <div className="rows__row">
              <span className="rows__k">Phone</span>
              <span className="rows__v">{customer.phone}</span>
            </div>
          )}
          {customer.company && (
            <div className="rows__row">
              <span className="rows__k">Company</span>
              <span className="rows__v">{customer.company}</span>
            </div>
          )}
          <div className="rows__row">
            <span className="rows__k">Member since</span>
            <span className="rows__v">
              {customer.createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <p className="small">
          To change any of this, or to have the account deleted, email{" "}
          <a className="link link--accent" href={`mailto:${site.contact.serviceEmail}`}>
            {site.contact.serviceEmail}
          </a>
          . Editing in place arrives with the rest of the account area.
        </p>
      </PageSection>

      <PageSection eyebrow="Next" title="What this account will do.">
        <div className="prose">
          <ul>
            <li>
              <strong>Checkout and payment.</strong> Not built yet. When it is, an order
              attaches to this account rather than to an email address typed again.
            </li>
            <li>
              <strong>Your quotes.</strong> Enquiries you send while signed in will be
              listed here.
            </li>
          </ul>
        </div>
        <div className="phero__actions">
          <Link className="btn btn--ghost" href="/products">
            Browse products
          </Link>
          <SignOutButton />
        </div>
      </PageSection>
    </>
  );
}
