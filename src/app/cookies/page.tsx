/**
 * Cookie policy.
 *
 * The honest version is short, because this site stores nothing on a
 * visitor's device: there is no `document.cookie` anywhere in the codebase, no
 * `localStorage`, no `sessionStorage`, and `src/components/analytics.tsx`
 * renders a tag only when `NEXT_PUBLIC_ANALYTICS_SRC` is set — which
 * `src/lib/env.ts` requires to be a cookieless one. That is also why the site
 * carries no consent banner: there is nothing to consent to.
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

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { site } from "@/content/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "What this website stores on your device, which is almost nothing: no analytics cookies, no advertising cookies, and no tracking across other sites.",
};

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
        lead={`${site.brand.name} sets no cookies of its own on this website. No analytics cookies, no advertising cookies, and nothing that follows you to another site.`}
        anchors={[
          { href: "#what", label: "What a cookie is" },
          { href: "#ours", label: "What we set" },
          { href: "#third-party", label: "Third parties" },
          { href: "#control", label: "Your controls" },
          { href: "#law", label: "Your rights" },
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
        title="Nothing, and that is deliberate."
        lead="This is a catalogue and enquiry site. It has no login, no basket and no personalisation, so there is no state to keep in your browser."
      >
        <div className="prose">
          <ul>
            <li>
              <strong>No first-party cookies.</strong> This website does not write a
              cookie when you browse it, read a product page, or send an enquiry.
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
            That is why you have not been shown a cookie banner. A banner for a site that
            sets no cookies is theatre, and it trains people to click &ldquo;accept&rdquo;
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
            Because we set nothing of our own, blocking cookies will not break browsing,
            product pages or downloads. The one thing it can affect is the security check
            on the enquiry forms: if you block the Cloudflare cookies above, you may be
            asked to pass that check more often, or a submission may be refused. If that
            happens, call or email us instead — the numbers are on the{" "}
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
            <Tmpl /> and we will reply {site.contact.responseTime}.
          </p>
        </div>

        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Grievance officer</span>
            <span className="rows__v">Name and designation <Tmpl label="fill in" /></span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Data requests</span>
            <span className="rows__v">
              <a href={`mailto:${site.contact.privacyEmail}`}>{site.contact.privacyEmail}</a>{" "}
              <Tmpl />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Customer support</span>
            <span className="rows__v">
              <a href={`mailto:${site.contact.serviceEmail}`}>{site.contact.serviceEmail}</a>
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Entity</span>
            <span className="rows__v">
              {site.legal.entity} · GSTIN {site.legal.gstin} <Tmpl />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Post</span>
            <span className="rows__v">
              {site.offices[0]?.label}, {site.offices[0]?.lines.join(", ")} <Tmpl />
            </span>
          </div>
        </div>

        <p className="small">
          If we change what this site stores, we will change this page and date it. Last
          reviewed: <Tmpl label="add the date you publish this" />. See also the{" "}
          <Link className="link link--accent" href="/privacy">
            privacy policy
          </Link>{" "}
          and the{" "}
          <Link className="link link--accent" href="/terms">
            terms of use
          </Link>
          .
        </p>
      </PageSection>
    </>
  );
}
