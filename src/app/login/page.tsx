/**
 * Sign in.
 *
 * Nothing on this site requires it. There is no redirect here from anywhere,
 * no guard on the catalogue and no wall in front of the downloads — an
 * account exists so there is a party to attach an order to once checkout is
 * built, and until then signing in buys you a saved profile and nothing more.
 * That is worth saying on the page rather than leaving a visitor to wonder
 * what they are missing.
 *
 * `?next=` is honoured only when it starts with a slash, which is checked in
 * the form component. An open redirect on a sign-in page is how a phishing
 * link gets to borrow your domain.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { PageHero, PageSection } from "@/components/page-shell";
import { site } from "@/content/site";
import { capabilities } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your account. Browsing, downloads and enquiries do not need one.",
  robots: { index: false, follow: true },
};

/**
 * What went wrong at Google, in words a visitor can act on.
 *
 * The callback redirects here with a short code and never a description: the
 * detail that matters to us — a redirect_uri_mismatch, say — belongs in the
 * log where it can be fixed, and is of no use to the person reading this.
 */
const GOOGLE_ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in is not switched on yet. Use your email and password.",
  google_cancelled: "Google sign-in was cancelled. Nothing has changed.",
  google_expired: "That sign-in attempt timed out. Please try again.",
  google_state: "That sign-in could not be verified. Please start again from this page.",
  google_failed:
    "Google sign-in did not complete. Try again, or use your email and password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const problem = error ? GOOGLE_ERRORS[error] : undefined;

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Sign in."
        lead={`You do not need an account to browse ${site.brand.name}, download a datasheet or send an enquiry. One is only needed when you come to pay.`}
      />

      <PageSection>
          {problem && (
            <div className="notice notice--err" role="alert">
              <strong>{problem}</strong>
            </div>
          )}
          <AuthForm mode="login" next={next} google={capabilities.google} />
          <p className="small">
            No account yet?{" "}
            <Link className="link link--accent" href="/register">
              Create one
            </Link>
            . Forgotten your password? Email{" "}
            <a className="link link--accent" href={`mailto:${site.contact.serviceEmail}`}>
              {site.contact.serviceEmail}
            </a>{" "}
            and we will reset it by hand until the reset flow is built.
          </p>
      </PageSection>
    </>
  );
}
