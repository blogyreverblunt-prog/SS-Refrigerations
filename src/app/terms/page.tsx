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
 * TEMPLATE — have this reviewed before you trade on it.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, PageSection, Tmpl } from "@/components/page-shell";
import { site } from "@/content/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms for using this website, the product image and specification notices, quotation validity, warranty scope and our e-waste handling note.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of use"
        lead="What this website is, what a quotation commits us to, and what happens to the cabinet at the end of its life."
        anchors={[
          { href: "#site", label: "This website" },
          { href: "#specs", label: "Specifications" },
          { href: "#images", label: "Images" },
          { href: "#quotes", label: "Quotations" },
          { href: "#warranty", label: "Warranty" },
          { href: "#ewaste", label: "E-waste" },
          { href: "#ip", label: "IP" },
        ]}
      />

      <PageSection id="site" eyebrow="This website" title="Information, not an offer.">
        <div className="prose">
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
        <div className="prose">
          <ul>
            <li>Validity: 30 days from issue unless stated otherwise. <Tmpl label="confirm" /></li>
            <li>Prices are exclusive of GST unless the quotation says otherwise.</li>
            <li>
              Freight, unloading, positioning, electrical work and any civil work are
              quoted as separate lines where they apply.
            </li>
            <li>
              Lead times are indicative and start from receipt of a confirmed order and
              any advance. <Tmpl label="confirm" />
            </li>
            <li>
              Cold rooms and remote-condenser systems are quoted after a site survey.
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
              <Tmpl /> and we will point you at the nearest authorised collection point.
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
            Governing law and jurisdiction: <Tmpl label="fill in" /> the courts at
            [city], India.
          </p>
        </div>
      </PageSection>
    </>
  );
}
