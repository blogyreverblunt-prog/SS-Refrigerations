/**
 * Contact & Enquiry — the conversion point of the whole site.
 *
 * Two things this page does that a default contact page does not:
 *
 *  1. It routes three audiences AWAY from the form before they mis-use it.
 *     Foster opens with "got a question? read our FAQs", then "report a
 *     fault", then "vacancies", and it works: a service complaint sent to the
 *     sales desk is a slow service complaint.
 *
 *  2. It offers the phone and WhatsApp with equal weight. A large share of
 *     Indian B2B buyers will not fill in a form at all, and Elanpro treats
 *     WhatsApp as a first-class channel rather than a floating button.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { EnquiryForm } from "@/components/enquiry-form";
import { ArrowRight, Chat, Phone, Pin, Wrench } from "@/components/icons";
import { SocialRow } from "@/components/social";
import { site, telLink, whatsappLink } from "@/content/site";
import { env } from "@/lib/env";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote, reach the sales or service desk by phone, WhatsApp or email, find our offices and our grievance officer, or apply to become a dealer.",
};

const ANCHORS = [
  { href: "#enquiry", label: "Request a quote" },
  { href: "#channels", label: "Phone & WhatsApp" },
  { href: "#write", label: "Who to write to" },
  { href: "#offices", label: "Offices" },
  { href: "#dealership", label: "Become a dealer" },
  { href: "#grievance", label: "Grievances" },
] as const;

/**
 * The desks, and what each one handles.
 *
 * All five addresses are the same inbox today (see `site.contact`), and a
 * table that prints one address five times is a table that says nothing. So
 * `ONE_INBOX` decides the shape: while they are identical the page states the
 * address once and the table becomes subject lines, which is the thing that
 * actually routes a message. Give the desks real addresses later and the
 * three-column version comes back on its own — no edit here.
 */
const DESKS = [
  {
    desk: "Sales and quotations",
    tag: "Quote",
    email: site.contact.salesEmail,
    for: "New enquiries, pricing, site visits, tenders",
  },
  {
    desk: "Service and spares",
    tag: "Service",
    email: site.contact.serviceEmail,
    for: "Breakdowns, AMC, parts, warranty claims",
  },
  {
    desk: "Dealers and distribution",
    tag: "Dealership",
    email: site.contact.salesEmail,
    for: "Territory enquiries, dealer pricing, brand assets",
  },
  {
    desk: "Careers",
    tag: "Careers",
    email: site.contact.careersEmail,
    for: "Applications, with the role after it",
  },
  {
    desk: "Privacy and data requests",
    tag: "Privacy",
    email: site.contact.privacyEmail,
    for: "Access, correction or erasure of your data",
  },
] as const;

const ONE_INBOX = new Set(DESKS.map((d) => d.email)).size === 1;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>Tell us what the kitchen needs.</>}
        lead={`We quote per site — freight, installation and any non-standard dimension all move the number. Send the model and quantity if you have them, or just describe the job. You will hear back ${site.contact.responseTime}.`}
        actions={
          <>
            <a className="btn btn--primary" href={telLink(site.contact.salesPhone)}>
              <Phone size={14} /> {site.contact.salesPhone}
            </a>
            <a className="btn btn--ghost" href={whatsappLink("Enquiry from the website:")}>
              <Chat size={14} /> WhatsApp
            </a>
          </>
        }
        anchors={ANCHORS}
      >
        {/* Route the wrong audiences out before they reach the form. */}
        <div className="blk" style={{ paddingTop: 0 }}>
          <div className="cards">
            <Link className="card" href="/support#request">
              <span className="card__icon"><Wrench /></span>
              <h2 className="card__title">A cabinet has stopped cooling</h2>
              <p>
                That is the service desk, not sales. Log it with the model and serial
                number and an engineer is assigned.
              </p>
              <span className="link link--accent">Service &amp; support <ArrowRight size={12} /></span>
            </Link>
            <Link className="card" href="/downloads">
              <span className="card__icon"><ArrowRight /></span>
              <h2 className="card__title">You need a spec sheet or a manual</h2>
              <p>
                Spec sheets, manuals, brochures, certificates and CAD are on the
                downloads page. Nothing is gated.
              </p>
              <span className="link link--accent">Downloads <ArrowRight size={12} /></span>
            </Link>
            <Link className="card" href="#dealership">
              <span className="card__icon"><Pin /></span>
              <h2 className="card__title">You want to sell our range</h2>
              <p>
                Dealer and distributor enquiries have their own short form at the
                bottom of this page.
              </p>
              <span className="link link--accent">Become a dealer <ArrowRight size={12} /></span>
            </Link>
          </div>
        </div>
      </PageHero>

      {/* -------------------------------------------------------- enquiry */}
      <PageSection
        id="enquiry"
        eyebrow="Request a quote"
        title="Nine fields, because every extra one costs a reply."
      >
        <div className="split">
          <EnquiryForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          {/*
            No phone and email here. They are in the three tiles directly
            below this form and again under "who to write to" — a third copy
            beside the form they are an alternative to helped nobody. What
            belongs next to a form is what happens after you press send.
          */}
          <div className="aside">
            <div className="rows">
              <div className="rows__row">
                <span className="rows__k">Hours</span>
                <span className="rows__v">{site.contact.hours}</span>
              </div>
              <div className="rows__row">
                <span className="rows__k">Response</span>
                <span className="rows__v">{site.contact.responseTime}</span>
              </div>
            </div>
            <p className="small">
              Comparing two models? Put them side by side on{" "}
              <Link className="link link--accent" href="/compare">compare</Link> and send
              the shortlist with the enquiry. Prefer to talk? The numbers are just below.
            </p>
          </div>
        </div>
      </PageSection>

      {/* ------------------------------------------------------- channels */}
      <PageSection
        id="channels"
        eyebrow="Direct channels"
        title="Or skip the form entirely."
      >
        <div className="callout">
          <div className="callout__grid">
            <div>
              <p className="callout__k">Sales</p>
              <p className="callout__v">
                <a href={telLink(site.contact.salesPhone)}>{site.contact.salesPhone}</a> <Tmpl />
              </p>
              <p className="small">New enquiries, quotes, site visits</p>
            </div>
            <div>
              <p className="callout__k">Service</p>
              <p className="callout__v">
                <a href={telLink(site.contact.servicePhone)}>{site.contact.servicePhone}</a> <Tmpl />
              </p>
              <p className="small">Breakdowns, spares, AMC</p>
            </div>
            <div>
              <p className="callout__k">WhatsApp</p>
              <p className="callout__v">
                <a href={whatsappLink("Enquiry from the website:")}>Start a chat</a>
              </p>
              <p className="small">Photos of the site or the rating plate welcome</p>
            </div>
          </div>
        </div>
      </PageSection>

      {/* ------------------------------------------------- email and social */}
      <PageSection
        id="write"
        eyebrow="Email"
        title="Who to write to."
        lead="Five desks. They share one inbox today, so the subject line is what gets your message to the right person — and every one of them is read."
      >
        {ONE_INBOX ? (
          <>
            <div className="prose">
              <p>
                Everything reaches the same desk today —{" "}
                <a
                  className="link link--accent"
                  href={`mailto:${site.contact.salesEmail}`}
                >
                  {site.contact.salesEmail}
                </a>{" "}
                — so the subject line is what routes it. Put one of these at the front of
                yours and it lands with the right person.
              </p>
            </div>
            <div className="table-wrap">
              <table className="spec-table">
                <caption>Subject lines</caption>
                <thead>
                  <tr>
                    <th scope="col">Start with</th>
                    <th scope="col">For</th>
                  </tr>
                </thead>
                <tbody>
                  {DESKS.map((d) => (
                    <tr key={d.desk}>
                      <th scope="row">{d.tag}</th>
                      <td>{d.for}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="table-wrap">
            <table className="spec-table">
              <caption>Email addresses</caption>
              <thead>
                <tr>
                  <th scope="col">Desk</th>
                  <th scope="col">Address</th>
                  <th scope="col">What to send it</th>
                </tr>
              </thead>
              <tbody>
                {DESKS.map((d) => (
                  <tr key={d.desk}>
                    <th scope="row">{d.desk}</th>
                    <td>
                      <a className="link link--accent" href={`mailto:${d.email}`}>
                        {d.email}
                      </a>
                    </td>
                    <td>{d.for}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="split">
          <div className="prose">
            <h3>What to put in it</h3>
            <ul>
              <li>
                <strong>For a quote:</strong> the model or the job, the quantity, the
                city, and when you need it. That is enough for a price.
              </li>
              <li>
                <strong>For a fault:</strong> the model code and serial number from the
                rating plate inside the door, and what the cabinet is doing. A photograph
                of the plate saves a phone call.
              </li>
              <li>
                <strong>Never send</strong> a card number, a CVV, an OTP or a password. We
                will not ask for any of them, by email or on the phone, and anybody who
                does is not us.
              </li>
            </ul>
            <p className="small">
              We reply {site.contact.responseTime}, {site.contact.hours.toLowerCase()}.
              Outside those hours, email and the form are both queued for the next
              working morning.
            </p>
          </div>

          <div className="aside">
            <p className="eyebrow">Follow us</p>
            <p className="small">
              Installations, new models and service notices. The marks below go live as
              soon as the profiles do — Facebook, Instagram, LinkedIn and YouTube.
            </p>
            <SocialRow size={16} />
          </div>
        </div>
      </PageSection>

      {/* -------------------------------------------------------- offices */}
      <PageSection
        id="offices"
        eyebrow="Offices"
        title="Where we are."
        lead="A verifiable address and a GSTIN are what separate a supplier from a listing. Both belong on this page."
      >
        <div className="cards cards--2">
          {site.offices.map((o) => (
            <article className="card" key={o.label}>
              <span className="card__icon"><Pin /></span>
              <h3 className="card__title">
                {o.label} <Tmpl />
              </h3>
              <p>
                {o.lines.map((l) => (
                  <span key={l} style={{ display: "block" }}>{l}</span>
                ))}
              </p>
              <p className="small">
                <a href={telLink(o.phone)}>{o.phone}</a>
              </p>
              {o.mapUrl ? (
                <a className="link link--accent" href={o.mapUrl} target="_blank" rel="noreferrer">
                  Open in Maps <ArrowRight size={12} />
                </a>
              ) : (
                <span className="small">
                  <Tmpl label="add mapUrl" /> Paste a Google Maps link in{" "}
                  <code>site.offices</code> and this becomes a link.
                </span>
              )}
            </article>
          ))}
        </div>

        {/*
          The single legal-identity block on the site. It was here and again
          beside the grievance officer below; "who you are dealing with" is an
          answer to "where are you", so it lives with the addresses.
        */}
        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Registered name</span>
            <span className="rows__v">{site.legal.entity} <Tmpl /></span>
          </div>
          <div className="rows__row">
            <span className="rows__k">CIN</span>
            <span className="rows__v">{site.legal.cin} <Tmpl /></span>
          </div>
          <div className="rows__row">
            <span className="rows__k">GSTIN</span>
            <span className="rows__v">{site.legal.gstin} <Tmpl /></span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Jurisdiction</span>
            <span className="rows__v">
              Courts at {site.legal.jurisdiction} <Tmpl label="confirm" />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Business hours</span>
            <span className="rows__v">{site.contact.hours}</span>
          </div>
        </div>
      </PageSection>

      {/* ----------------------------------------------------- dealership */}
      <PageSection
        id="dealership"
        eyebrow="Partner with us"
        title="Become a dealer or distributor."
        lead="The dealer is the buying channel in this market, and a partner intake route is the cheapest way to extend coverage. Tell us the territory you cover and the lines you already carry."
      >
        <div className="split">
          <EnquiryForm
            turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            kind="dealership"
            intro="Dealership enquiry"
            submitLabel="Apply for a dealership"
            messageLabel="Territory, lines carried and showroom details"
            messagePlaceholder="City and districts covered, how long you have been trading, which refrigeration or kitchen-equipment brands you carry today, showroom and godown area, service team size."
          />
          <div className="aside">
            <div className="rows">
              <div className="rows__row">
                <span className="rows__k">What we provide</span>
                <span className="rows__v">
                  Dealer pricing, product training, co-branded collateral and
                  marketing support. <Tmpl label="confirm" />
                </span>
              </div>
              <div className="rows__row">
                <span className="rows__k">What we ask</span>
                <span className="rows__v">
                  A display of the core range, a service-trained technician and
                  stocking of fast-moving spares. <Tmpl label="confirm" />
                </span>
              </div>
            </div>
            <p className="small">
              Looking for a dealer rather than a dealership? The service city list is
              on <Link className="link link--accent" href="/support#network">service &amp; support</Link>.
            </p>
          </div>
        </div>
      </PageSection>

      {/* ------------------------------------------------------ grievances */}
      <PageSection
        id="grievance"
        eyebrow="Complaints"
        title="If something has gone wrong."
        lead="A named officer, a stated window, and the escalation route published next to it. The Consumer Protection (E-Commerce) Rules 2020 require the first two of any Indian seller; the third is here because a complaints process you cannot escalate is not one."
      >
        <div className="split">
          <div className="rows">
            <div className="rows__row">
              <span className="rows__k">Grievance officer</span>
              <span className="rows__v">
                {site.legal.grievanceOfficer.name},{" "}
                {site.legal.grievanceOfficer.designation} <Tmpl label="fill in" />
              </span>
            </div>
            <div className="rows__row">
              <span className="rows__k">Email</span>
              <span className="rows__v">
                <a href={`mailto:${site.legal.grievanceOfficer.email}`}>
                  {site.legal.grievanceOfficer.email}
                </a>
              </span>
            </div>
            <div className="rows__row">
              <span className="rows__k">Phone</span>
              <span className="rows__v">
                <a href={telLink(site.legal.grievanceOfficer.phone)}>
                  {site.legal.grievanceOfficer.phone}
                </a>{" "}
                <Tmpl /> · {site.contact.hours}
              </span>
            </div>
            <div className="rows__row">
              <span className="rows__k">Acknowledged</span>
              <span className="rows__v">
                Within {site.legal.grievanceOfficer.acknowledgeWithin}, with a reference
                you can quote
              </span>
            </div>
            <div className="rows__row">
              <span className="rows__k">Resolved</span>
              <span className="rows__v">
                Within {site.legal.grievanceOfficer.resolveWithin} of receipt
              </span>
            </div>
            <div className="rows__row">
              <span className="rows__k">Post</span>
              <span className="rows__v">
                {site.offices[0]?.label}, {site.offices[0]?.lines.join(", ")} <Tmpl />
              </span>
            </div>
          </div>

          <div className="aside">
            <p className="eyebrow">If we do not fix it</p>
            <p className="small">
              Escalating past us needs no permission from us. The National Consumer
              Helpline takes complaints on <strong>1915</strong>, as does the consumer
              commission with jurisdiction over you; anything about your personal data
              can go to the Data Protection Board of India.
            </p>
            <p className="small">
              Our registered name, CIN, GSTIN and the courts that govern a dispute are
              with the addresses under{" "}
              <Link className="link link--accent" href="#offices">offices</Link>. The{" "}
              <Link className="link link--accent" href="/privacy#rights">privacy policy</Link>{" "}
              sets out your data rights and the{" "}
              <Link className="link link--accent" href="/terms#law">terms of use</Link>{" "}
              the governing law.
            </p>
          </div>
        </div>
      </PageSection>
    </>
  );
}
