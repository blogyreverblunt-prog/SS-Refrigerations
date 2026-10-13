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
 * TEMPLATE — have this reviewed before you trade on it. The clauses below are
 * accurate to what the code actually does; the company-specific blanks come
 * from src/content/site.ts.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { site } from "@/content/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What we collect when you send an enquiry, why we hold it, how long for, and how to have it removed.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        lead={`How ${site.brand.name} handles the details you send us. Short, because we collect very little.`}
        anchors={[
          { href: "#collect", label: "What we collect" },
          { href: "#why", label: "Why" },
          { href: "#retention", label: "Retention" },
          { href: "#rights", label: "Your rights" },
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
          </ul>
          <p>
            Processors we use: our email provider, our hosting and database providers, and
            our notification tooling. Each is used solely to deliver the service above.{" "}
            <Tmpl label="name them" />
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
          </ul>
        </div>
      </PageSection>

      <PageSection id="rights" eyebrow="Your rights" title="Access, correction, erasure.">
        <div className="prose">
          <p>
            You can ask us what we hold about you, have it corrected, have it deleted, or
            withdraw consent. Write to{" "}
            <a className="link link--accent" href={`mailto:${site.contact.privacyEmail}`}>
              {site.contact.privacyEmail}
            </a>{" "}
            <Tmpl /> with enough detail to find the record — the enquiry reference, if you
            have it.
          </p>
          <p>
            Withdrawing consent stops us contacting you. Where we are required to keep a
            record for warranty or accounting reasons we will say so and keep only that.
          </p>
        </div>
      </PageSection>

      <PageSection id="contact" eyebrow="Grievances" title="Who to write to.">
        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Grievance officer</span>
            <span className="rows__v">Name and designation <Tmpl label="fill in" /></span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Email</span>
            <span className="rows__v">
              <a href={`mailto:${site.contact.privacyEmail}`}>{site.contact.privacyEmail}</a>{" "}
              <Tmpl />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Post</span>
            <span className="rows__v">
              {site.offices[0]?.label}, {site.offices[0]?.lines.join(", ")} <Tmpl />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Entity</span>
            <span className="rows__v">
              {site.legal.entity} · GSTIN {site.legal.gstin} <Tmpl />
            </span>
          </div>
        </div>
        <p className="small">
          See also the <Link className="link link--accent" href="/cookies">cookie policy</Link>{" "}
          and the <Link className="link link--accent" href="/terms">terms of use</Link>,
          which carry the product-image and specification-change notices.
        </p>
      </PageSection>
    </>
  );
}
