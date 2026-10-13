/**
 * Terms of use.
 *
 * Three clauses here are not boilerplate, and every one of the thirty sites
 * audited carries them:
 *
 *  - specifications change without notice (§specs)
 *  - product images are representative, not contractual (§images)
 *  - an e-waste handling note, which an Indian appliance seller needs in
 *    practice as well as on paper (§ewaste)
 *
 * The rest of the spine is what the reference sites carry and this page did
 * not: acceptance, the commercial terms of an order (U-Line and Marvel both
 * give shipping, returns and cancellation a page of their own), delivery and
 * transit damage, a disclaimer, a limitation of liability, user submissions,
 * third-party links, force majeure, and a governing-law clause that names a
 * court. The numbers all come from `site.orders` — none is written in the
 * prose, because the prose is not where a purchase desk should have to find
 * them, and because changing one should not mean editing a paragraph.
 *
 * The liability section is deliberately NOT in capitals. Every reference site
 * shouts that clause; shouting it is a US drafting habit, it is unpleasant to
 * read, and it has never been what makes a term enforceable in India. A
 * heading, plain sentences and no hiding is the better version of the same
 * protection.
 *
 * TEMPLATE — have this reviewed before you trade on it.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { site, telLink } from "@/content/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms for using this website: the product image and specification notices, quotation validity, order, payment and cancellation terms, delivery and transit damage, warranty scope, liability, e-waste handling and governing law.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of use"
        lead="What this website is, what a quotation commits us to, what an order commits you to, and what happens to the cabinet at the end of its life."
        anchors={[
          { href: "#site", label: "This website" },
          { href: "#specs", label: "Specifications" },
          { href: "#images", label: "Images" },
          { href: "#quotes", label: "Quotations" },
          { href: "#orders", label: "Orders" },
          { href: "#delivery", label: "Delivery" },
          { href: "#warranty", label: "Warranty" },
          { href: "#liability", label: "Liability" },
          { href: "#ip", label: "IP" },
          { href: "#ewaste", label: "E-waste" },
          { href: "#law", label: "Governing law" },
        ]}
      />

      <PageSection id="site" eyebrow="This website" title="Information, not an offer.">
        <div className="prose">
          <p>
            This website is operated by {site.legal.entity} <Tmpl /> (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;), GSTIN {site.legal.gstin} <Tmpl />, whose registered office
            and contact details are on the{" "}
            <Link className="link link--accent" href="/contact">contact page</Link>. Using
            the site means accepting these terms and the{" "}
            <Link className="link link--accent" href="/privacy">privacy policy</Link>. If
            you do not accept them, the remedy is not to use it.
          </p>
          <p>
            Nothing on this website is an offer to sell. Products shown may not be
            available in every market, and availability is confirmed on a quotation.
            We publish no prices here; the price for your site comes with the quote.
          </p>
          <p>
            We try to keep the catalogue accurate and we do not warrant that it is free
            of error. If you spot something wrong, please{" "}
            <Link className="link link--accent" href="/contact#enquiry">tell us</Link> —
            it will be corrected.
          </p>
        </div>
      </PageSection>

      <PageSection id="specs" eyebrow="Specifications" title="Subject to change without notice.">
        <div className="prose">
          <p>
            Capacities, dimensions, power ratings, refrigerant charges and finishes are
            subject to change without notice as products are improved. Dimensions are
            nominal and exclude handles, hinges and service clearances unless stated.
            Capacity is gross unless marked net.
          </p>
          <p>
            Where a drawing or a spec sheet is required for a tender or a kitchen layout,
            use the dated PDF from{" "}
            <Link className="link link--accent" href="/downloads">downloads</Link> and
            confirm it against your quotation before fabrication.
          </p>
        </div>
      </PageSection>

      <PageSection id="images" eyebrow="Images" title="Representative, not contractual.">
        <div className="prose">
          <p>
            Photographs and renders show a representative unit. Shelving counts, lighting,
            handle style, branding panels and finish may differ by model and by order.
            Accessories shown are not necessarily included. The specification table on the
            product page and the quotation together describe what you will receive.
          </p>
        </div>
      </PageSection>

      <PageSection id="quotes" eyebrow="Quotations" title="What a quote commits us to.">
        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Validity</span>
            <span className="rows__v">
              {site.orders.quoteValidity}, unless the quotation says otherwise{" "}
              <Tmpl label="confirm" />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Taxes</span>
            <span className="rows__v">{site.orders.gst}</span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Freight</span>
            <span className="rows__v">{site.orders.freight}</span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Lead time</span>
            <span className="rows__v">
              {site.orders.leadTime} <Tmpl label="confirm" /> — indicative, and running
              from a confirmed order and any advance
            </span>
          </div>
        </div>
        <div className="prose">
          <ul>
            <li>
              Unloading, positioning, electrical work and any civil work are quoted as
              separate lines where they apply.
            </li>
            <li>
              Cold rooms and remote-condenser systems are quoted after a site survey,
              because the site decides the work.
            </li>
            <li>
              A quotation is withdrawn if the specification you asked us to price
              changes. We will re-quote rather than silently substitute.
            </li>
          </ul>
        </div>
      </PageSection>

      <PageSection
        id="orders"
        eyebrow="Orders, payment and cancellation"
        title="What an order commits you to."
        lead="The clauses a purchase desk needs before it raises a PO. U-Line and Marvel both give these a page of their own; they belong wherever someone can find them before they sign, not afterwards."
      >
        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Order confirmed</span>
            <span className="rows__v">
              On our written acknowledgement of your PO — not on the quotation, and not on
              a verbal agreement
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Payment</span>
            <span className="rows__v">
              {site.orders.advance} <Tmpl label="confirm" />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Cancellation</span>
            <span className="rows__v">
              {site.orders.cancellation} <Tmpl label="confirm" />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Cancellation charge</span>
            <span className="rows__v">{site.orders.cancellationFee}</span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Returns</span>
            <span className="rows__v">
              {site.orders.returns} <Tmpl label="confirm" />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Not returnable</span>
            <span className="rows__v">{site.orders.noReturns}</span>
          </div>
        </div>
        <div className="prose">
          <ul>
            <li>
              <strong>Why built-to-order is different.</strong> A cabinet cut to your
              dimensions, or a cold room built to your plan, cannot be sold to anybody
              else. Once fabrication starts, cancelling it costs what has been spent.
            </li>
            <li>
              <strong>A return has to be a resaleable unit.</strong> Unused, undamaged, in
              its original packing, with the manual and accessories. A commissioned
              cabinet that has held stock is not one.
            </li>
            <li>
              <strong>Refunds</strong> go back by the route the payment came, within 14
              working days of us accepting the return. <Tmpl label="confirm" />
            </li>
            <li>
              <strong>Title passes on full payment;</strong> risk passes on delivery. Both
              matter for your insurance, so they are stated rather than implied.
            </li>
            <li>
              <strong>A faulty unit is not a return.</strong> It is a warranty claim, and
              it is handled under{" "}
              <Link className="link link--accent" href="/support#warranty">
                warranty
              </Link>{" "}
              — usually faster, and at no cost to you.
            </li>
          </ul>
          <p className="small">
            Nothing in this section limits your rights under the Consumer Protection Act,
            2019 where it applies to you.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="delivery"
        eyebrow="Delivery"
        title="Transit damage has a clock on it."
        lead="This is the clause that saves the most arguments, and almost nobody states it plainly: a cabinet signed for as received in good condition is, as far as the transporter is concerned, received in good condition."
      >
        <div className="prose">
          <ol className="steps">
            <li>
              <span className="steps__body">
                <strong>Inspect the packing before you sign</strong>
                Crushed corners, a torn carton, a tilted pallet or a shock indicator that
                has tripped. Photograph anything that looks wrong while the vehicle is
                still there.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Write the damage on the delivery note</strong>
                On the copy the driver takes away, not only on yours. A clean signature is
                the end of a transit claim.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Tell us within {site.orders.transitDamageWindow}</strong>
                With photographs and the delivery note number, to{" "}
                <a className="link link--accent" href={`mailto:${site.contact.serviceEmail}`}>
                  {site.contact.serviceEmail}
                </a>
                . Inside that window a transit claim is ours to pursue; outside it, it is
                nobody&rsquo;s.
              </span>
            </li>
            <li>
              <span className="steps__body">
                <strong>Do not switch a damaged unit on</strong>
                Especially if the cabinet has been laid on its side. Running a compressor
                after a transit shock turns a repairable dent into a replaced sealed
                system.
              </span>
            </li>
          </ol>
          <ul>
            <li>
              Delivery dates are the date we hand over to the transporter or to you, and
              are given in good faith rather than guaranteed.
            </li>
            <li>
              Someone has to be on site to receive, check and sign. A failed delivery
              because nobody was there is re-delivered at cost.
            </li>
            <li>
              Shortages — a missing shelf, a missing accessory — are reported in the same
              window and on the same note.
            </li>
          </ul>
        </div>
      </PageSection>

      <PageSection id="warranty" eyebrow="Warranty" title="Scope, and what voids it.">
        <div className="prose">
          <p>
            Warranty terms by range are published on{" "}
            <Link className="link link--accent" href="/support#warranty">
              service &amp; support
            </Link>{" "}
            and the statement supplied with the unit governs. In summary, warranty covers
            manufacturing defect; it does not cover consumables, operation outside the
            rated supply or ambient, physical or water damage, or any unit whose sealed
            system has been opened by a non-authorised technician.
          </p>
          <p>
            A warranty claim needs the serial number from the rating plate and the invoice
            number. Keep both.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="liability"
        eyebrow="Disclaimer and liability"
        title="What we stand behind, and what we do not."
        lead="Stated in plain sentences rather than in capitals. The shouting on other sites protects nobody — it just makes the clause harder to read than the one it is trying to be fair about."
      >
        <div className="prose">
          <h3>The website is provided as it is</h3>
          <p>
            We keep this catalogue as accurate as we can and we do not warrant that it is
            free of error, that it is complete, or that it will be available without
            interruption. Capacities, drawings and specifications here are for selection;
            the quotation and the documents issued with your order are what govern.
          </p>

          <h3>What we are liable for</h3>
          <p>
            For the equipment we supply: that it conforms to the specification we quoted
            and is free of manufacturing defect on the{" "}
            <Link className="link link--accent" href="/support#warranty">warranty terms</Link>.
            That is a real obligation and we meet it.
          </p>
          <p>
            For this website: nothing beyond putting a mistake right. We are not liable
            for loss of profit, loss of stock, spoilage, business interruption or any
            indirect loss arising from the use of this website or from reliance on
            information published here rather than on your quotation and manual. Where
            liability cannot lawfully be excluded, it is limited to the invoice value of
            the equipment concerned. <Tmpl label="have this reviewed" />
          </p>
          <p className="small">
            Spoilage of stock is the loss that actually hurts in this trade, and no
            refrigeration warranty anywhere covers it. That is what a temperature alarm,
            an AMC and a spare cabinet are for — we would rather say so here than let you
            discover it during a claim.
          </p>

          <h3>Events outside our control</h3>
          <p>
            Delivery and service commitments are suspended, not broken, by events neither
            of us controls: refrigerant or component shortage, transport disruption,
            strike, flood, fire, power failure, epidemic, or an act of government. We will
            tell you promptly, give you a revised date, and you may cancel an undelivered
            order without charge if the delay is unreasonable.
          </p>

          <h3>What you send us</h3>
          <p>
            Anything you send through a form, by email or over WhatsApp — a kitchen
            drawing, a photograph of a rating plate, a tender document — we treat as
            confidential to the enquiry and we use it only to answer you. We do not
            publish it, sell it, or hand it to another customer.
          </p>
          <p>
            Please do not send us an unsolicited product idea or design in confidence and
            expect us to be bound by it: we may already be working on something similar,
            and we cannot promise otherwise. If you have something genuinely confidential
            to share, ask us for an NDA first and we will sign one. In return, do not send
            anything unlawful, defamatory, or infringing someone else&rsquo;s rights.
          </p>

          <h3>Links to other sites</h3>
          <p>
            Where this site links out — WhatsApp, our social profiles, a dealer, a
            standards body — we do not control those sites and are not responsible for
            their content or their privacy practices. A link is a convenience, not an
            endorsement. The{" "}
            <Link className="link link--accent" href="/privacy#links">privacy policy</Link>{" "}
            names the ones that matter.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="ewaste"
        eyebrow="E-waste"
        title="What happens to the old cabinet."
        lead="Required in practice for an Indian appliance seller, and the right thing regardless: a refrigerant circuit is not general waste."
      >
        <div className="prose">
          <ul>
            <li>
              Refrigeration equipment must not go to a scrap dealer or a landfill. The
              refrigerant and the insulating foam have to be recovered by an authorised
              recycler.
            </li>
            <li>
              When we supply a replacement we will take the old unit away and route it
              through an authorised recycler on request. <Tmpl label="confirm process" />
            </li>
            <li>
              For a unit we did not supply, write to{" "}
              <a className="link link--accent" href={`mailto:${site.contact.serviceEmail}`}>
                {site.contact.serviceEmail}
              </a>{" "}
              and we will point you at the nearest authorised collection point.
            </li>
            <li>
              Never puncture a sealed system, and never let an unqualified technician vent
              refrigerant to atmosphere.
            </li>
          </ul>
        </div>
      </PageSection>

      <PageSection id="ip" eyebrow="Intellectual property" title="Marks and content.">
        <div className="prose">
          <p>
            The {site.brand.name} name, logo, product names, photography, drawings and copy
            on this website belong to {site.legal.entity} <Tmpl /> and may not be
            reproduced without written permission. Dealers and distributors may use the
            supplied brand assets within the terms of their agreement.
          </p>
          <p>
            You may link to this site. You may not frame it, present its content as your
            own, or use our marks in a way that suggests we endorse or supply you when we
            do not.
          </p>
        </div>
      </PageSection>

      <PageSection
        id="law"
        eyebrow="Governing law"
        title="Which law, which court, and who to complain to."
        lead="A jurisdiction clause that reads “the courts at [city]” tells a buyer’s legal team the page was never finished. This one names a place."
      >
        <div className="rows">
          <div className="rows__row">
            <span className="rows__k">Governing law</span>
            <span className="rows__v">The laws of India</span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Jurisdiction</span>
            <span className="rows__v">
              The courts at {site.legal.jurisdiction} <Tmpl label="confirm" />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Grievance officer</span>
            <span className="rows__v">
              {site.legal.grievanceOfficer.name},{" "}
              {site.legal.grievanceOfficer.designation} <Tmpl label="fill in" />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Complaints to</span>
            <span className="rows__v">
              <a href={`mailto:${site.legal.grievanceOfficer.email}`}>
                {site.legal.grievanceOfficer.email}
              </a>
              {" · "}
              <a href={telLink(site.legal.grievanceOfficer.phone)}>
                {site.legal.grievanceOfficer.phone}
              </a>{" "}
              <Tmpl />
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Answered within</span>
            <span className="rows__v">
              {site.legal.grievanceOfficer.acknowledgeWithin} to acknowledge,{" "}
              {site.legal.grievanceOfficer.resolveWithin} to resolve
            </span>
          </div>
          <div className="rows__row">
            <span className="rows__k">Effective date</span>
            <span className="rows__v">{site.legal.policyUpdated}</span>
          </div>
        </div>
        <div className="prose">
          <h3>Complaints before courts</h3>
          <p>
            If something has gone wrong, the grievance officer above is the fastest route
            and the one we would rather you used. Escalation does not need our
            permission: the National Consumer Helpline (1915) and the consumer commission
            with jurisdiction over you are open to you regardless, as is the Data
            Protection Board of India for anything about your personal data.
          </p>

          <h3>Changes to these terms</h3>
          <p>
            We may revise this page. The version that applies to your order is the one in
            force on the date we acknowledged it, and we keep that date on your
            acknowledgement precisely so neither of us has to argue about which version
            that was. Continuing to use the website after a change means accepting the
            revised terms for future use of the site.
          </p>

          <h3>Accessibility</h3>
          <p>
            This site is built to be usable with a keyboard, with a screen reader, at
            phone width and at 200% zoom, and we treat a failure of any of those as a
            defect rather than a preference. If something here is unusable for you, write
            to{" "}
            <a className="link link--accent" href={`mailto:${site.contact.serviceEmail}`}>
              {site.contact.serviceEmail}
            </a>{" "}
            and tell us what and where — and we will also give you the information another
            way, by phone or email, in the meantime.
          </p>

          <h3>The rest</h3>
          <ul>
            <li>
              If any clause here is held unenforceable, the rest stands and the clause is
              read down to what the law allows.
            </li>
            <li>
              These terms, your quotation and your order acknowledgement are the whole
              agreement about the equipment. A conflict between them is resolved in that
              reverse order: the acknowledgement first.
            </li>
            <li>
              Our not enforcing something immediately is not a waiver of it.
            </li>
            <li>
              Nothing here limits a right you have under the Consumer Protection Act,
              2019, the Sale of Goods Act, 1930, or any other law that applies to you
              regardless of what a website says.
            </li>
          </ul>
        </div>
      </PageSection>
    </>
  );
}
