/**
 * Service & Support — ONE page.
 *
 * True runs ~25 URLs under /support and Traulsen ~15. Those exist to serve a
 * claims system with hundreds of technicians and millions of cabinets in the
 * field; copying the structure ships twenty empty pages, which reads as a
 * dead company (SITE-SECTIONS-REPORT.md §7, PURE-PLAY-BENCHMARK.md §4.3).
 *
 * Order is deliberate. The helpline is first because a restaurant that has
 * lost a cabinet on a Friday night is not reading prose. Then the four
 * aftermarket verbs Arneg reduces this to, then the form, then the terms
 * someone evaluating us before the purchase came here to check.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { ServiceRequestForm } from "@/components/service-request-form";
import {
  ArrowRight,
  Box,
  Chat,
  Phone,
  Pin,
  Refresh,
  Shield,
  Wrench,
} from "@/components/icons";
import { site, telLink, whatsappLink } from "@/content/site";
import { env } from "@/lib/env";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Service & support",
  description:
    "Service helpline, AMC and preventive maintenance plans, genuine spares, warranty terms, installation and site survey, and the city list our engineers cover.",
};

const ANCHORS = [
  { href: "#helpline", label: "Helpline" },
  { href: "#request", label: "Log a request" },
  { href: "#amc", label: "AMC" },
  { href: "#warranty", label: "Warranty" },
  { href: "#install", label: "Installation" },
  { href: "#network", label: "Service network" },
  { href: "#faq", label: "FAQ" },
] as const;

/** The four things a customer comes to a support page to do. */
const ACTIONS = [
  {
    icon: <Wrench />,
    title: "Book a service visit",
    body: "Log the model and serial number and an engineer is assigned with a ticket reference you can quote on the phone.",
    href: "#request",
    cta: "Log a request",
  },
  {
    icon: <Box />,
    title: "Order genuine spares",
    body: "Gaskets, fans, controllers, hinges and compressors for every model we have shipped. Tell us the model code; we will confirm the part.",
    href: "#request",
    cta: "Ask for a part",
  },
  {
    icon: <Shield />,
    title: "Take an AMC",
    body: "Preventive visits before summer, priority response, and a predictable cost instead of a surprise invoice in May.",
    href: "#amc",
    cta: "Compare plans",
  },
  {
    icon: <Refresh />,
    title: "Replace an ageing cabinet",
    body: "An R404A unit from 2014 costs more in electricity than an AMC costs. We will quote the swap and take the old cabinet away.",
    href: "/contact#enquiry",
    cta: "Get a replacement quote",
  },
] as const;

const FAQ = [
  {
    group: "Sales",
    items: [
      {
        q: "Why is there no price on the product pages?",
        a: "Because the honest answer depends on the site. Freight, installation, voltage stabilisation and any non-standard dimension all move the number, so we quote per site — usually " + site.contact.responseTime + ".",
      },
      {
        q: "What is the typical lead time?",
        a: "TEMPLATE — state the real figure per range, e.g. ex-stock models in 3–5 working days, built-to-order cabinets in 3–4 weeks, cold rooms after a site survey.",
      },
      {
        q: "Do you sell domestic refrigerators?",
        a: "No. Everything we build is commercial equipment for a business: continuous duty, 43 °C ambient, serviceable in place.",
      },
    ],
  },
  {
    group: "Service and warranty",
    items: [
      {
        q: "What does the warranty cover, and what voids it?",
        a: "Terms by range are in the warranty table above. It is void on an unstabilised supply outside the stated voltage band, on physical or water damage, and where a non-authorised technician has opened the sealed system.",
      },
      {
        q: "How fast is a breakdown attended?",
        a: "TEMPLATE — commit to the response you can actually hold, by city tier, and say it here. An unmet promise on this page costs more than a slower one.",
      },
      {
        q: "Does the warranty transfer if I sell the cabinet?",
        a: "TEMPLATE — state your policy. The common one is: yes, for the remaining period, once the new owner's details are registered against the serial number.",
      },
    ],
  },
  {
    group: "Spares",
    items: [
      {
        q: "How long are spares available after a model is discontinued?",
        a: "TEMPLATE — e.g. seven years from the last production date for sealed-system parts.",
      },
      {
        q: "I do not know the part number.",
        a: "Send the model code and serial number with a photograph of the part. Identifying it is our job, not yours.",
      },
    ],
  },
  {
    group: "Delivery and installation",
    items: [
      {
        q: "Is installation included?",
        a: "Plug-in cabinets are delivered, positioned and commissioned. Cold rooms and remote-condenser systems are quoted with installation as a line item because the site decides the work.",
      },
      {
        q: "What do you need from us before delivery?",
        a: "A clear route in, a level floor, the power point within reach of the cable and a drain where the model needs one. The site survey list above is the full version.",
      },
    ],
  },
  {
    group: "Accounts",
    items: [
      {
        q: "What are the payment terms?",
        a: "TEMPLATE — advance, part-advance or credit terms, plus the GST treatment and the bank details you want quoted on a PO.",
      },
    ],
  },
] as const;

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Service and support"
        title={<>When it stops cooling,<br />you need a person.</>}
        lead="Commercial refrigeration is bought on after-sales confidence. This page is the whole of ours: who to call, what an AMC covers, what the warranty says and which cities we reach."
        actions={
          <>
            <a className="btn btn--primary" href={telLink(site.contact.servicePhone)}>
              <Phone size={14} /> Call the helpline
            </a>
            <a className="btn btn--ghost" href={whatsappLink("Service request — model code:")}>
              <Chat size={14} /> WhatsApp us
            </a>
          </>
        }
        anchors={ANCHORS}
      />

      {/* ------------------------------------------------------- helpline */}
      <PageSection id="helpline">
        <div className="callout">
          <div className="callout__grid">
            <div>
              <p className="callout__k">Service helpline</p>
              <p className="callout__v">
                <a href={telLink(site.contact.servicePhone)}>{site.contact.servicePhone}</a>{" "}
                <Tmpl />
              </p>
              <p className="small">{site.contact.hours}</p>
            </div>
            <div>
              <p className="callout__k">Service email</p>
              <p className="callout__v">
                <a href={`mailto:${site.contact.serviceEmail}`}>{site.contact.serviceEmail}</a>
              </p>
              <p className="small">Replies {site.contact.responseTime}</p>
            </div>
            <div>
              <p className="callout__k">WhatsApp</p>
              <p className="callout__v">
                <a href={whatsappLink("Service request — model code:")}>Start a chat</a>
              </p>
              <p className="small">Send a photo of the rating plate</p>
            </div>
          </div>
        </div>

        <div className="cards cards--4">
          {ACTIONS.map((a) => (
            <article className="card" key={a.title}>
              <span className="card__icon">{a.icon}</span>
              <h3 className="card__title">{a.title}</h3>
              <p>{a.body}</p>
              <Link className="link link--accent" href={a.href}>
                {a.cta} <ArrowRight size={12} />
              </Link>
            </article>
          ))}
        </div>
      </PageSection>

      {/* -------------------------------------------------------- request */}
      <PageSection
        id="request"
        eyebrow="Log a request"
        title="Service, spares or an AMC quote."
        lead="The model code and serial number are on the rating plate inside the door. With those two fields filled in, the first call you get is from an engineer rather than from someone asking for them."
      >
        <div className="split">
          <ServiceRequestForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          <div className="aside">
            <div className="rows">
              <div className="rows__row">
                <span className="rows__k">Prefer to call?</span>
                <span className="rows__v">
                  <a href={telLink(site.contact.servicePhone)}>{site.contact.servicePhone}</a>
                </span>
              </div>
              <div className="rows__row">
                <span className="rows__k">Hours</span>
                <span className="rows__v">{site.contact.hours}</span>
              </div>
              <div className="rows__row">
                <span className="rows__k">Out of hours</span>
                <span className="rows__v">
                  Log the request here — it is queued for the next working morning. <Tmpl />
                </span>
              </div>
            </div>
            <p className="small">
              Looking for a manual or a spec sheet instead?{" "}
              <Link className="link link--accent" href="/downloads">
                Downloads <ArrowRight size={12} />
              </Link>
            </p>
          </div>
        </div>
      </PageSection>

      {/* ------------------------------------------------------------ AMC */}
      <PageSection
        id="amc"
        eyebrow="AMC and preventive maintenance"
        title="Serviced before summer, not during it."
        lead="Condenser coils clog, gaskets harden and gas leaks slowly. Every one of those is cheap to catch in February and expensive to discover in May."
      >
        <div className="table-wrap">
          <table className="spec-table">
            <caption>
              Annual maintenance plans <Tmpl label="confirm scope and pricing" />
            </caption>
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col">What it covers</th>
                <th scope="col">Visits</th>
                <th scope="col">Best for</th>
              </tr>
            </thead>
            <tbody>
              {site.amcPlans.map((p) => (
                <tr key={p.name}>
                  <th scope="row">{p.name}</th>
                  <td>{p.covers}</td>
                  <td>{p.visits}</td>
                  <td>{p.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="phero__actions">
          <Link className="btn btn--primary" href="#request">
            Ask for an AMC quote <ArrowRight />
          </Link>
        </div>
      </PageSection>

      {/* ------------------------------------------------------- warranty */}
      <PageSection
        id="warranty"
        eyebrow="Warranty"
        title="Stated here, not buried in a PDF."
        lead="True leads with its labour-and-compressor terms as a headline feature because it closes deals. The same logic applies here: if the terms are good, say them on the page."
      >
        <div className="table-wrap">
          <table className="spec-table">
            <caption>
              Warranty by range <Tmpl label="confirm terms" />
            </caption>
            <thead>
              <tr>
                <th scope="col">Range</th>
                <th scope="col">Parts</th>
                <th scope="col">Compressor</th>
                <th scope="col">Labour</th>
              </tr>
            </thead>
            <tbody>
              {site.warranty.map((w) => (
                <tr key={w.range}>
                  <th scope="row">{w.range}</th>
                  <td>{w.parts}</td>
                  <td>{w.compressor}</td>
                  <td>{w.labour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose">
          <h3>What voids it</h3>
          <ul>
            <li>Operation outside the stated supply voltage band without stabilisation.</li>
            <li>The sealed system opened by anyone other than an authorised engineer.</li>
            <li>Physical damage, flooding, fire, or use outside the rated ambient.</li>
            <li>A missing serial number — which is why the plate matters.</li>
          </ul>
          <p>
            To claim, log a request above with the serial and invoice number. Warranty
            statements per range are on{" "}
            <Link className="link link--accent" href="/downloads?kind=warranty">downloads</Link>.
          </p>
        </div>
      </PageSection>

      {/* -------------------------------------------- install / site survey */}
      <PageSection
        id="install"
        eyebrow="Installation and commissioning"
        title="Before your cabinet arrives."
        lead="A cabinet that will not fit through the kitchen door is the most expensive mistake in this category — and the most common. Williams publishes a site survey guide for exactly this reason; here is the short version."
      >
        <div className="split">
          <ol className="steps">
            <li>
              <span className="steps__body">
                <strong>Measure the route in, not the gap it goes into</strong>
                Doorways, lift car, staircase turns and any threshold. Send us the
                narrowest dimension on the route.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Check the floor is level and load-bearing</strong>
                A loaded three-section cabinet is 400 kg+. On an uneven floor the
                doors will not seal and the condensate will not drain.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Leave the stated clearances</strong>
                Front-breathing units need air at the plinth; rear-breathing units
                need the gap behind. Blocking either is the single most common cause
                of a &ldquo;not cooling&rdquo; call.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Have the power point in reach</strong>
                A dedicated 16 A point within the cable length, on a stabilised
                supply. No extension leads.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Provide a drain where the model needs one</strong>
                Display cases and cold rooms need one; most plug-in cabinets
                evaporate their own condensate.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Let it stand before switching on</strong>
                Four hours upright after transport, so the oil returns to the
                compressor. Our engineer commissions it, logs the pull-down and
                hands over the manual.
              </span>
            </li>
          </ol>
          <div className="aside">
            <div className="rows">
              <div className="rows__row">
                <span className="rows__k">Delivery</span>
                <span className="rows__v">
                  Positioned and commissioned on plug-in models. <Tmpl label="confirm" />
                </span>
              </div>
              <div className="rows__row">
                <span className="rows__k">Cold rooms</span>
                <span className="rows__v">Site survey first, then installation is quoted as a line item.</span>
              </div>
              <div className="rows__row">
                <span className="rows__k">Old cabinet</span>
                <span className="rows__v">
                  We take it away and route it through an authorised e-waste
                  recycler. See the{" "}
                  <Link className="link link--accent" href="/terms#ewaste">e-waste note</Link>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* -------------------------------------------------------- network */}
      <PageSection
        id="network"
        eyebrow="Service network"
        title="The cities we actually reach."
        lead={`"Pan-India service" is not believed without a list. Ice Make's entire network page is twenty city names in a table, and it answers the question — so here is ours, with ${site.serviceCities.length} cities.`}
      >
        <ul className="citylist">
          {site.serviceCities.map((c) => (
            <li key={c}>
              <Pin size={12} /> {c}
            </li>
          ))}
        </ul>
        <p className="small">
          <Tmpl label="replace with your coverage" /> Edit{" "}
          <code>src/content/site.ts</code> → <code>serviceCities</code>. Not on the
          list? We still cover you through a partner engineer —{" "}
          <Link className="link link--accent" href="/contact#enquiry">ask us</Link>.
        </p>
      </PageSection>

      {/* ------------------------------------------------------------ FAQ */}
      <PageSection
        id="faq"
        eyebrow="FAQ"
        title="Grouped by who answers it."
        lead="Everest groups its FAQ by department rather than by topic, because every answer has to route to a person or a form. These do."
      >
        {FAQ.map((g) => (
          <div className="stack" key={g.group}>
            <p className="eyebrow">{g.group}</p>
            <div className="faq">
              {g.items.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </PageSection>
    </>
  );
}
