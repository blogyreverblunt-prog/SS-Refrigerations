/**
 * Cookie policy.
 *
 * The honest version is short, because browsing this site stores nothing on
 * your device: no `localStorage`, no `sessionStorage`, and
 * `src/components/analytics.tsx` renders a tag only when
 * `NEXT_PUBLIC_ANALYTICS_SRC` is set — which `src/lib/env.ts` requires to be
 * a cookieless one. That is also why the site carries no consent banner:
 * there is nothing to consent to.
 *
 * ONE first-party cookie exists, and this page is wrong the moment it stops
 * naming it. `src/modules/accounts/session.ts` sets `kalt_session` when
 * somebody registers or signs in — httpOnly, SameSite=Lax, 30 days, holding
 * a random token and nothing else. It is strictly necessary (it IS the
 * sign-in) and it is never set for a visitor who does not create an account.
 * If the session module's name, lifetime or attributes change, FIRST_PARTY
 * below changes with it.
 *
 * What the page must not do is claim that for the whole stack. The forms are
 * protected by Cloudflare Turnstile, and Cloudflare's own edge sets security
 * cookies (`cf_clearance`, `__cf_bm`) depending on how the production domain
 * is configured. Those are named here as what they are — strictly necessary
 * security cookies set by a third party — and marked TEMPLATE so whoever
 * finishes the DNS and WAF setup confirms which of them actually appear.
 *
 * Written against Indian law — the DPDP Act 2023 and the IT Act's SPDI Rules
 * — because that is the regime this business sits under. Reads alongside
 * /privacy, which is the fuller notice.
 *
 * TEMPLATE — have this reviewed before you trade on it. The statements below
 * are accurate to what this code does today; a change of analytics vendor or
 * an embedded third-party widget makes them wrong.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { LegalNote } from "@/components/legal-note";
import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { site } from "@/content/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "What this website stores on your device, which is almost nothing: no analytics cookies, no advertising cookies, and no tracking across other sites.",
};

/**
 * The one cookie this application sets itself.
 *
 * Mirrors `sessionCookie()` in src/modules/accounts/session.ts. Kept as data
 * so the table and the code can be diffed against each other rather than
 * read in two places and hoped about.
 */
const FIRST_PARTY = [
  {
    name: "kalt_session",
    setBy: `${site.brand.name} (first party)`,
    purpose:
      "Keeps you signed in to a customer account. It holds one random token and nothing else — no name, no email, nothing readable. Set only when you register or sign in, and deleted when you sign out.",
    duration: "30 days, or until you sign out",
    category: "Strictly necessary",
  },
] as const;

/**
 * Set by Cloudflare's edge rather than by this application.
 *
 * Kept as data so the table and any future consent copy cannot drift apart on
 * what is actually dropped.
 */
const THIRD_PARTY = [
  {
    name: "cf_clearance",
    setBy: "Cloudflare",
    purpose:
      "Records that your browser passed the anti-spam check on a form, so you are not challenged again on every page.",
    duration: "Up to 30 days, per our Cloudflare settings",
    category: "Strictly necessary",
  },
  {
    name: "__cf_bm",
    setBy: "Cloudflare",
    purpose:
      "Bot management. Tells automated traffic apart from people so the enquiry forms are not flooded.",
    duration: "30 minutes",
    category: "Strictly necessary",
  },
] as const;

const BROWSER_STEPS = [
  {
    browser: "Chrome",
    path: "Settings → Privacy and security → Third-party cookies",
  },
  {
    browser: "Safari",
    path: "Settings → Safari → Advanced → Block all cookies",
  },
  {
    browser: "Firefox",
    path: "Settings → Privacy & Security → Cookies and Site Data",
  },
  {
    browser: "Edge",
    path: "Settings → Cookies and site permissions → Manage cookies",
  },
] as const;

export default function CookiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Cookie policy"
        lead={`Browsing ${site.brand.name} sets no cookies at all. Signing in to a customer account sets exactly one, and all it does is keep you signed in. No analytics cookies, no advertising cookies, and nothing that follows you to another site.`}
        anchors={[
          { href: "#what", label: "What a cookie is" },
          { href: "#ours", label: "What we set" },
          { href: "#third-party", label: "Third parties" },
          { href: "#control", label: "Your controls" },
          { href: "#law", label: "Your rights" },
          { href: "#changes", label: "Updates" },
        ]}
      />

      <PageSection id="what" eyebrow="Plainly" title="What a cookie is.">
        <div className="prose">
          <p>
            A cookie is a small text file a website asks your browser to keep, and which
            the browser hands back on your next visit. Some are needed for a site to work
            at all — they remember that you are signed in, or that you already passed a
            security check. Others exist to watch which pages you read and to build an
            advertising profile from it.
          </p>
          <p>
            Only the second kind needs your permission. The same reasoning applies to
            anything else that stores data in your browser, such as local storage or a
            tracking pixel, whatever it is called.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="ours"
        eyebrow="What we set"
        title="One cookie, and only if you ask for an account."
        lead="This is a catalogue and enquiry site. It has no basket and no personalisation, so there is almost no state to keep in your browser — and what little there is, is listed here rather than summarised."
      >
        <div className="table-wrap">
          <table className="spec-table">
            <caption>Cookies this website sets</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Set by</th>
                <th scope="col">Purpose</th>
                <th scope="col">Duration</th>
                <th scope="col">Category</th>
              </tr>
            </thead>
            <tbody>
              {FIRST_PARTY.map((c) => (
                <tr key={c.name}>
                  <th scope="row">{c.name}</th>
                  <td>{c.setBy}</td>
                  <td>{c.purpose}</td>
                  <td>{c.duration}</td>
                  <td>{c.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose">
          <ul>
            <li>
              <strong>Nothing at all while you browse.</strong> Reading a product page,
              comparing models, downloading a spec sheet or sending an enquiry writes no
              cookie. An account is optional on this site, and if you never create one,
              nothing of ours is ever stored on your device.
            </li>
            <li>
              <strong>The session cookie is the sign-in.</strong> It carries a random
              token, which we keep only as a one-way hash — so the cookie cannot be read
              to learn anything about you, and our own database cannot be read to forge
              it. Signing out deletes it at both ends. It is not used for analytics and
              it cannot be used to track you anywhere else.
            </li>
            <li>
              <strong>No local storage.</strong> Nothing is kept in your browser&rsquo;s
              local or session storage either.
            </li>
            <li>
              <strong>No advertising or profiling cookies.</strong> We do not run
              retargeting, we do not build a profile of you, and we do not share
              behavioural data with ad networks.
            </li>
            <li>
              <strong>No analytics cookies.</strong> If we measure traffic at all, we use
              a cookieless tag that counts page views without identifying anybody. Should
              we ever adopt one that sets cookies, we will update this page and ask you
              first — with a banner whose &ldquo;reject&rdquo; button actually stops the
              script loading.
            </li>
          </ul>
          <p>
            That is why you have not been shown a cookie banner. Consent is owed for
            cookies that measure or profile you — not for the one that keeps you signed
            in, which you ask for by signing in. A banner on a site with nothing else to
            consent to is theatre, and it trains people to click &ldquo;accept&rdquo;
            without reading.
          </p>
          <p className="small">
            What we <em>do</em> collect is what you type into a form, and that is covered
            by the{" "}
            <Link className="link link--accent" href="/privacy">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </PageSection>

      <PageSection
        id="third-party"
        eyebrow="Third parties"
        title="Two security cookies we do not control."
        lead="Our enquiry forms are protected against automated abuse by Cloudflare. That protection runs at the network edge, before a request reaches us, and it may set its own cookies."
      >
        <div className="table-wrap">
          <table className="spec-table">
            <caption>
              Cookies that may be set by Cloudflare <Tmpl label="confirm against the live setup" />
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Set by</th>
                <th scope="col">Purpose</th>
                <th scope="col">Duration</th>
                <th scope="col">Category</th>
              </tr>
            </thead>
            <tbody>
              {THIRD_PARTY.map((c) => (
                <tr key={c.name}>
                  <th scope="row">{c.name}</th>
                  <td>{c.setBy}</td>
                  <td>{c.purpose}</td>
                  <td>{c.duration}</td>
                  <td>{c.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose">
          <p>
            Both are security cookies. Neither is used for advertising, and neither tells
            Cloudflare or us who you are. Which of them appears depends on how the domain
            is configured, so treat the table as the outside limit rather than a promise
            that both are always present.
          </p>
          <p>
            Cloudflare publishes its own account of these at{" "}
            <a
              className="link link--accent"
              href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/"
              target="_blank"
              rel="noreferrer noopener"
            >
              developers.cloudflare.com
            </a>
            .
          </p>
          <p className="small">
            We embed no social media widgets, no third-party video players and no live
            chat, each of which would otherwise bring its own cookies with it.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="control"
        eyebrow="Your controls"
        title="Blocking cookies here costs you very little."
      >
        <div className="table-wrap">
          <table className="spec-table">
            <caption>Where the setting lives</caption>
            <thead>
              <tr>
                <th scope="col">Browser</th>
                <th scope="col">Path</th>
              </tr>
            </thead>
            <tbody>
              {BROWSER_STEPS.map((b) => (
                <tr key={b.browser}>
                  <th scope="row">{b.browser}</th>
                  <td>{b.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose">
          <p>
            Blocking cookies will not break browsing, product pages or downloads — none
            of that depends on one. Two things are affected. Signing in to an account
            cannot work without the session cookie, because that cookie <em>is</em> the
            sign-in; a browser that refuses it will appear to sign you in and then show
            you signed out. And if you block the Cloudflare cookies above, you may be
            asked to pass the form security check more often, or a submission may be
            refused.
          </p>
          <p>
            Neither is a reason to accept anything you would rather not. Everything on
            this site that matters — the catalogue, every spec sheet, the warranty terms,
            the service helpline — works with cookies switched off entirely, and if a
            form will not go through you can call or email us instead. The numbers are on
            the{" "}
            <Link className="link link--accent" href="/contact">
              contact page
            </Link>
            .
          </p>
        </div>
      </PageSection>

      <PageSection id="law" eyebrow="Your rights" title="Under Indian law, and who to write to.">
        <div className="prose">
          <p>
            This policy is written against the Digital Personal Data Protection Act, 2023
            and the Information Technology Act, 2000 together with its rules on sensitive
            personal data. Where a cookie or similar technology would process your
            personal data for anything other than keeping the site secure and working, we
            would need your consent first, and we would ask for it before setting it —
            not after.
          </p>
          <p>
            You can ask us what we hold about you, have it corrected or deleted, or
            withdraw a consent you previously gave. Write to{" "}
            <a className="link link--accent" href={`mailto:${site.contact.privacyEmail}`}>
              {site.contact.privacyEmail}
            </a>{" "}
            and we will reply {site.contact.responseTime}.
          </p>
        </div>

        <p className="small">
          A complaint about any of this goes to our grievance officer, published with the
          rest of our contact details on the{" "}
          <Link className="link link--accent" href="/contact#grievance">
            contact page
          </Link>
          . The{" "}
          <Link className="link link--accent" href="/privacy">
            privacy policy
          </Link>{" "}
          is the fuller notice.
        </p>
      </PageSection>

      <PageSection
        id="changes"
        eyebrow="Updates"
        title="When this page changes."
        lead="A policy with no date on it cannot be relied on: you cannot tell whether it describes what was true when you used the site."
      >
        <div className="prose">
          <ul>
            <li>
              <strong>Adding a cookie means editing this page first.</strong> The tables
              above are generated from a list that sits beside the code that sets the
              cookies, so a new one that is not described here is a bug, not an
              oversight we hope you overlook.
            </li>
            <li>
              <strong>Anything that measures or profiles you needs your consent.</strong>{" "}
              If we ever adopt analytics that sets cookies, or embed a third-party player
              or chat widget that brings its own, we will ask before it loads — with a
              banner whose &ldquo;reject&rdquo; actually stops the script, not one that
              records a refusal and loads it anyway.
            </li>
            <li>
              <strong>We will not quietly re-date it.</strong> A substantive change moves
              the date below and, where it affects people with accounts, is emailed to
              them.
            </li>
          </ul>
        </div>

        <p className="small">
          This policy covers this website only — not a dealer&rsquo;s own site, and not
          WhatsApp or any social platform you reach us through, each of which sets its
          own cookies under its own terms.
        </p>

        <LegalNote
          page="cookies"
          writtenAgainst="DPDP Act 2023; IT Act 2000 and its SPDI Rules"
        />
      </PageSection>
    </>
  );
}
