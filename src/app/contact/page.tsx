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
import { site, telLink, whatsappLink } from "@/content/site";
import { env } from "@/lib/env";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote, reach the sales or service desk by phone or WhatsApp, find our offices, or apply to become a dealer.",
};

const ANCHORS = [
  { href: "#enquiry", label: "Request a quote" },
  { href: "#channels", label: "Phone & WhatsApp" },
  { href: "#offices", label: "Offices" },
  { href: "#dealership", label: "Become a dealer" },
] as const;

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
          <div className="aside">
            <div className="rows">
              <div className="rows__row">
                <span className="rows__k">Sales</span>
                <span className="rows__v">
                  <a href={telLink(site.contact.salesPhone)}>{site.contact.salesPhone}</a> <Tmpl />
                </span>
              </div>
              <div className="rows__row">
                <span className="rows__k">Email</span>
                <span className="rows__v">
                  <a href={`mailto:${site.contact.salesEmail}`}>{site.contact.salesEmail}</a> <Tmpl />
                </span>
              </div>
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
              the shortlist with the enquiry.
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

        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Registered name</span>
            <span className="rows__v">{site.legal.entity} <Tmpl /></span>
          </div>
          <div className="rows__row">
            <span className="rows__k">GSTIN</span>
            <span className="rows__v">{site.legal.gstin} <Tmpl /></span>
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
              <div className="rows__row">
                <span className="rows__k">Who to ask</span>
                <span className="rows__v">
                  <a href={`mailto:${site.contact.salesEmail}`}>{site.contact.salesEmail}</a>
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
    </>
  );
}
