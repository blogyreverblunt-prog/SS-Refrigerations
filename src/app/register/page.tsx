/**
 * Create an account.
 *
 * Asks for a name, an email and a password, with phone and company optional.
 * It does not ask for an address or a GST number: those belong to an order,
 * they go stale between registering and buying, and every extra field here is
 * paid for in registrations that do not finish.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { PageHero, PageSection } from "@/components/page-shell";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create an account to keep your enquiries and quotes together. Browsing and enquiries work without one.",
  robots: { index: false, follow: true },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Create an account."
        lead="Keeps your enquiries and quotes in one place, and is what a payment will be attached to when checkout opens. It takes a minute and nothing on the site is locked behind it."
      />

      <PageSection>
          <AuthForm mode="register" next={next} />
          <p className="small">
            Already registered?{" "}
            <Link className="link link--accent" href="/login">
              Sign in
            </Link>
            . By creating an account you agree to the{" "}
            <Link className="link link--accent" href="/terms">
              terms of use
            </Link>
            , and the{" "}
            <Link className="link link--accent" href="/privacy">
              privacy policy
            </Link>{" "}
            explains what {site.brand.name} does with these details.
          </p>
      </PageSection>
    </>
  );
}
