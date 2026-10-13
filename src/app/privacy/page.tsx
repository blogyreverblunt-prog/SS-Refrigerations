/**
 * Privacy policy.
 *
 * Not decoration: `lead.consent_at` is NOT NULL by design, which means every
 * enquiry in the database points at a specific, dated promise. This page is
 * that promise, and the consent checkbox on every form links here.
 *
 * Written against the DPDP Act 2023 vocabulary (notice, purpose, retention,
 * grievance officer) because that is the regime an Indian business collecting
 * enquiry data sits under.
 *
 * The section list is the one the three reference sites converge on —
 * collection, purpose, sharing, security, retention, rights, children,
 * third-party links, changes, and a dated contact block — with the
 * jurisdiction-specific parts (U-Line carries GDPR and CCPA notices) replaced
 * by the Indian equivalents. The order is ours: what we take, why, who sees
 * it, how it is held, how long, and what you can make us do about it.
 *
 * TEMPLATE — have this reviewed before you trade on it. The clauses below are
 * accurate to what the code actually does; the company-specific blanks come
 * from src/content/site.ts.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { LegalNote } from "@/components/legal-note";
import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { site } from "@/content/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What we collect when you send an enquiry or open an account, who processes it, how it is secured, how long we keep it, and how to have it corrected or removed.",
};

/**
 * The processors, named.
 *
 * Every row is a service this codebase actually talks to — they are the
 * optional blocks in src/lib/env.ts, not a generic list — so this table can
 * be checked against the deployment rather than believed. `where` says "set
 * at deployment" where the region is a console setting rather than a fact
 * about the vendor; fill those in once the account regions are chosen.
 */
const PROCESSORS = [
  {
    service: "Neon",
    role: "Hosts the database",
    sees: "Every enquiry, service request and account record",
    where: "Set at deployment",
  },
  {
    service: "Vercel",
    role: "Runs and serves this website",
    sees: "Request logs, and a form's contents while it is being handled",
    where: "Set at deployment",
  },
  {
    service: "Resend",
    role: "Sends our notification and reply emails",
    sees: "Your name, address and the text of the message",
    where: "Set at deployment",
  },
  {
    service: "Cloudflare",
    role: "Protects the forms against bots (Turnstile), and the network edge",
    sees: "Your IP address and browser signals during the check — not the form",
    where: "Global edge network",
  },
  {
    service: "Upstash",
    role: "Rate limiting, and queueing the work a form kicks off",
    sees: "A hashed IP address, and the reference of the enquiry to process",
    where: "Set at deployment",
  },
  {
    service: "Cloudflare R2",
    role: "Stores the documents this site serves",
    sees: "Spec sheets, manuals and certificates — no personal data",
    where: "Set at deployment",
  },
] as const;

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        lead={`How ${site.brand.name} handles the details you send us. We collect very little, we have named every service that touches it, and nothing here is sold to anybody.`}
        anchors={[
          { href: "#collect", label: "What we collect" },
          { href: "#why", label: "Why" },
          { href: "#share", label: "Who sees it" },
          { href: "#security", label: "Security" },
          { href: "#retention", label: "Retention" },
          { href: "#rights", label: "Your rights" },
          { href: "#children", label: "Children" },
          { href: "#changes", label: "Changes" },
          { href: "#contact", label: "Grievances" },
        ]}
      />

      <PageSection id="collect" eyebrow="What we collect" title="Only what a reply needs.">
        <div className="prose">
          <ul>
            <li>
              <strong>Enquiry forms.</strong> Name, email, phone, company, city and your
              message. On a service request, also the model code, serial number,
              purchase date, invoice number and the contact channel you chose.
            </li>
            <li>
              <strong>Attribution.</strong> The page you were on when you submitted, the
              referring site and any campaign tag in the link. No cross-site tracking
              and no advertising profile.
            </li>
            <li>
              <strong>A hashed IP address.</strong> Stored as a one-way HMAC for abuse
              prevention. The raw address is never written to the database.
            </li>
            <li>
              <strong>Consent.</strong> The moment you ticked the box, recorded against
              the enquiry.
            </li>
            <li>
              <strong>A customer account, only if you create one.</strong> An account is
              optional on this site — everything in the catalogue, every spec sheet and
              every form works without one. If you do register we hold your name, email
              address, and optionally a phone number and company; the sessions you have
              open, each with the browser it was opened from, so that signing out can
              end them; and your password <em>only</em> as a slow one-way hash (scrypt),
              which cannot be turned back into the password you typed. Nobody here can
              read your password, including us.
            </li>
          </ul>
          <p>
            We do not use advertising cookies and we do not sell data. We do not collect
            payment details on this website. What this site does and does not store on
            your device is set out in the{" "}
            <Link className="link link--accent" href="/cookies">
              cookie policy
            </Link>
            .
          </p>
        </div>
      </PageSection>

      <PageSection id="why" eyebrow="Why" title="To answer you, and to honour a warranty.">
        <div className="prose">
          <ul>
            <li>To respond to your enquiry, quote and follow up on it.</li>
            <li>To attend a service call, and to establish warranty status from the serial number.</li>
            <li>To keep a record of what was supplied to which site — a warranty obligation.</li>
            <li>To detect and block automated abuse of the forms.</li>
            <li>To operate your account and keep you signed in, if you created one.</li>
          </ul>
          <p>
            That is the whole list. We do not profile you, we do not score you, and
            nothing here is used to make an automated decision about you.
          </p>
          <h3>Marketing, and how to stop it</h3>
          <p>
            An enquiry is a request for a reply, not permission to add you to a mailing
            list. If we later send you product news you will have asked for it, every
            such email will carry a one-click unsubscribe, and acting on it stops the
            email without affecting anything you have bought from us. To be taken off
            every list at once, write to{" "}
            <a className="link link--accent" href={`mailto:${site.contact.privacyEmail}`}>
              {site.contact.privacyEmail}
            </a>
            . Service and warranty messages about equipment you own are not marketing and
            continue regardless — you can stop those by telling us to close the record.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="share"
        eyebrow="Who sees it"
        title="Us, and the services that deliver the site."
        lead="Named, because a privacy notice that says “trusted partners” is telling you nothing. Each of these is a processor: it handles data on our instruction, for the purpose in its row, and for nothing else."
      >
        <div className="table-wrap">
          <table className="spec-table">
            <caption>
              Processors <Tmpl label="confirm against the live deployment" />
            </caption>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">What it does</th>
                <th scope="col">What it can see</th>
                <th scope="col">Where</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map((p) => (
                <tr key={p.service}>
                  <th scope="row">{p.service}</th>
                  <td>{p.role}</td>
                  <td>{p.sees}</td>
                  <td>{p.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose">
          <h3>And nobody else</h3>
          <ul>
            <li>
              <strong>We do not sell personal data</strong>, and we do not share it with
              advertising networks or data brokers. There is no arrangement under which
              anyone pays us for it.
            </li>
            <li>
              <strong>An engineer or dealer gets only what the job needs.</strong> Where a
              partner engineer attends your site, they are given the site address, the
              contact name and number, and the fault — not your enquiry history.
            </li>
            <li>
              <strong>Lawful requests.</strong> We disclose data where a court, a tax
              authority or the police require it under Indian law, and we keep a record
              of each such disclosure.
            </li>
            <li>
              <strong>If the business is sold</strong> or merged, customer records move
              with the warranty obligations attached to them. The purpose would not
              change, and you would be told.
            </li>
          </ul>
          <h3>Processing outside India</h3>
          <p>
            Some of the services above run in data centres outside India.{" "}
            <Tmpl label="confirm the regions" /> That is permitted under the DPDP Act so
            long as the destination is not one the Central Government has restricted, and
            we hold each provider to written terms covering confidentiality, security and
            deletion on our instruction.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="security"
        eyebrow="Security"
        title="What protects it, and what to expect if that fails."
        lead="The useful version of this section names the measure rather than promising “industry-standard security”, which is a phrase with no content."
      >
        <div className="prose">
          <ul>
            <li>
              <strong>Encrypted in transit.</strong> The whole site is served over HTTPS,
              and so is every connection from it to the database and to the services
              above.
            </li>
            <li>
              <strong>Passwords are never stored.</strong> Only a memory-hard one-way
              hash (scrypt), which is useless to anyone who obtains it.
            </li>
            <li>
              <strong>Session tokens are stored hashed too.</strong> A copy of our
              database is not a set of live sessions, and signing out revokes a session
              immediately rather than waiting for it to expire.
            </li>
            <li>
              <strong>IP addresses are hashed on the way in.</strong> The raw address is
              never written down; what we keep cannot be reversed into it.
            </li>
            <li>
              <strong>Access is limited</strong> to the people who need it to quote,
              service or account for your order, over individual credentials.
            </li>
          </ul>
          <p>
            No transmission over the internet can be guaranteed secure, and we will not
            pretend otherwise. What we will do, if personal data here is breached, is
            tell you and the Data Protection Board of India, promptly and in plain
            language: what happened, what it affects, what we have done, and what you
            should do. That is an obligation under the DPDP Act and it is also the only
            decent way to behave.
          </p>
        </div>
      </PageSection>

      <PageSection id="retention" eyebrow="Retention" title="How long we keep it.">
        <div className="prose">
          <ul>
            <li>
              <strong>Enquiries that do not convert:</strong> 24 months, then deleted.{" "}
              <Tmpl label="confirm" />
            </li>
            <li>
              <strong>Customers:</strong> for the life of the equipment plus the statutory
              accounting period, because a warranty claim needs the original record.
            </li>
            <li>
              <strong>Job applications:</strong> 12 months, then the CV and the row are
              deleted automatically.
            </li>
            <li>
              <strong>A customer account:</strong> for as long as you keep it. Ask us to
              close it and the account and its sessions are deleted within 30 days —
              except the invoice and warranty records that tax and warranty law require
              us to retain, which are kept without the account attached to them.
            </li>
            <li>
              <strong>Sessions:</strong> 30 days at the outside, and immediately on sign
              out.
            </li>
            <li>
              <strong>Hashed IP addresses:</strong> 12 months, then dropped.{" "}
              <Tmpl label="confirm" /> They exist only to spot abuse of the forms.
            </li>
          </ul>
          <p>
            Where a record has to be kept for a reason above, it is kept for that reason
            alone — not quietly reused to market to you years later.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="rights"
        eyebrow="Your rights"
        title="Access, correction, erasure — and how to use them."
        lead="These are the rights the DPDP Act gives you. They cost nothing to exercise and using one is not held against you."
      >
        <div className="prose">
          <ul>
            <li>
              <strong>Know what we hold.</strong> A summary of your personal data, what we
              are doing with it, and who we have shared it with.
            </li>
            <li>
              <strong>Have it corrected or completed.</strong> A wrong phone number on a
              service record is your problem before it is ours — tell us and we will fix
              it.
            </li>
            <li>
              <strong>Have it erased.</strong> Unless a warranty or accounting obligation
              requires a specific record, in which case we will tell you which and keep
              only that.
            </li>
            <li>
              <strong>Withdraw consent.</strong> As easily as you gave it. This stops us
              contacting you; it does not retrospectively make lawful processing
              unlawful.
            </li>
            <li>
              <strong>Nominate someone.</strong> You may name a person to exercise these
              rights on your behalf if you die or become incapable of doing so.
            </li>
            <li>
              <strong>Complain, and escalate.</strong> First to our grievance officer
              below. If we do not resolve it, to the Data Protection Board of India.
            </li>
          </ul>

          <h3>How to make a request</h3>
          <p>
            Write to{" "}
            <a className="link link--accent" href={`mailto:${site.contact.privacyEmail}`}>
              {site.contact.privacyEmail}
            </a>{" "}
            with enough detail to find the record — the enquiry reference or the invoice
            number, if you have one. We may ask you to confirm something only the right
            person would know before we act, because handing someone else&rsquo;s service
            history to a caller who asked confidently is also a privacy failure. We will
            not ask you for a password, an OTP or a payment to process a request.
          </p>
          <p>
            We reply {site.contact.responseTime} and aim to complete a request within 30
            days. If it will take longer, you will be told why and when.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="children"
        eyebrow="Children"
        title="This is not a site for children."
        lead="Commercial refrigeration is sold to businesses, so there is no version of this where a child is our customer — which makes the rule easy to state and easy to keep."
      >
        <div className="prose">
          <ul>
            <li>
              We do not knowingly collect personal data from anyone under 18, and the
              forms here are addressed to a business.
            </li>
            <li>
              We do not and will not run behavioural advertising or tracking directed at
              children, which the DPDP Act prohibits outright.
            </li>
            <li>
              If you are a parent or guardian and believe a child has sent us their
              details, write to{" "}
              <a className="link link--accent" href={`mailto:${site.contact.privacyEmail}`}>
                {site.contact.privacyEmail}
              </a>{" "}
              and we will delete the record and confirm that we have.
            </li>
          </ul>
        </div>
      </PageSection>

      <PageSection
        id="links"
        eyebrow="Other sites"
        title="Where this site hands you off."
        lead="Three of them, and it is worth knowing which, because this policy stops at our edge."
      >
        <div className="prose">
          <ul>
            <li>
              <strong>WhatsApp.</strong> Every &ldquo;WhatsApp us&rdquo; button opens a
              chat on Meta&rsquo;s platform. The conversation is held under
              WhatsApp&rsquo;s terms as well as ours, and the number you message from is
              visible to us.
            </li>
            <li>
              <strong>Social profiles.</strong> The marks in the footer, when they lead
              anywhere, lead to Facebook, Instagram, LinkedIn and YouTube — each of which
              will know you visited it, through its own cookies and not ours.
            </li>
            <li>
              <strong>A dealer or a partner engineer.</strong> Their own site, their own
              privacy notice. Read it before you send them anything.
            </li>
          </ul>
          <p>
            We do not control any of those, we do not endorse what they do with data, and
            a link is not a recommendation of their privacy practices. We embed no
            third-party video player, social widget or live chat on this site, each of
            which would otherwise watch you read it.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="changes"
        eyebrow="Changes"
        title="When this notice changes."
      >
        <div className="prose">
          <p>
            We update this page when what we do with data changes — not to re-litigate
            consent you already gave. A change that materially affects you is dated here
            and, where you hold an account or an open enquiry, sent to you by email
            rather than left for you to find. Carrying on using the site is not how we
            will treat you as having agreed to something new that needs your consent.
          </p>
          <p>
            Every enquiry in our database records the moment consent was given, so we can
            always tell which version of this notice you were actually shown.
          </p>
        </div>

      </PageSection>

      <PageSection
        id="contact"
        eyebrow="Grievances"
        title="If we get it wrong."
        lead="A named person answers for this, because the DPDP Act and the Consumer Protection (E-Commerce) Rules both require one — and because “support@” is where complaints go to die."
      >
        <div className="prose">
          <p>
            Data requests go to{" "}
            <a className="link link--accent" href={`mailto:${site.contact.privacyEmail}`}>
              {site.contact.privacyEmail}
            </a>{" "}
            and are answered as set out under{" "}
            <Link className="link link--accent" href="#rights">your rights</Link> above.
            A <em>complaint</em> — about a request we handled badly, or anything else we
            did with your data — goes to our grievance officer, whose name, email, phone,
            postal address and response windows are published on the{" "}
            <Link className="link link--accent" href="/contact#grievance">contact page</Link>.
            They are in one place so that they are in a correct place.
          </p>
          <p>
            If we have not resolved it within the window stated there, or you are not
            satisfied with how we did, you can take a data protection complaint to the{" "}
            <strong>Data Protection Board of India</strong>. That needs no permission
            from us and costs you none of your other remedies.
          </p>
        </div>

        <LegalNote page="privacy" writtenAgainst="DPDP Act 2023; IT Act 2000 and its SPDI Rules" />
      </PageSection>
    </>
  );
}
