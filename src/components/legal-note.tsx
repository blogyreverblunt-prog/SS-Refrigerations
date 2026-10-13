/**
 * The tail every legal page shares: when it took effect, which law it is
 * written against, where to complain, and where the other two pages are.
 *
 * It exists because those four facts were hand-written on /privacy, /terms
 * and /cookies, and the grievance officer's name, email, phone and response
 * windows were restated on all three on top of that — four copies of one
 * contact block, which is four places to edit when a real officer is
 * appointed and three places for it to go stale.
 *
 * The rule this encodes: a legal page states the law it is making a promise
 * under, and links to the person who answers for it. The person lives on
 * /contact#grievance, once.
 *
 * `writtenAgainst` is per page because it genuinely differs — the privacy and
 * cookie notices answer to the DPDP Act, the terms answer to the Sale of
 * Goods and Consumer Protection Acts — so it is a prop rather than a constant.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { site } from "@/content/site";

const PAGES = [
  { key: "privacy", href: "/privacy", label: "Privacy policy" },
  { key: "cookies", href: "/cookies", label: "Cookie policy" },
  { key: "terms", href: "/terms", label: "Terms of use" },
] as const;

interface Props {
  /** The page this is rendered on, so it does not link to itself. */
  page: (typeof PAGES)[number]["key"];
  writtenAgainst?: ReactNode;
}

export function LegalNote({ page, writtenAgainst }: Props) {
  const others = PAGES.filter((p) => p.key !== page);

  return (
    <div className="rows">
      <div className="rows__row">
        <span className="rows__k">Effective date</span>
        <span className="rows__v">{site.legal.policyUpdated}</span>
      </div>

      {writtenAgainst && (
        <div className="rows__row">
          <span className="rows__k">Written against</span>
          <span className="rows__v">{writtenAgainst}</span>
        </div>
      )}

      <div className="rows__row">
        <span className="rows__k">Complaints</span>
        <span className="rows__v">
          <Link className="link link--accent" href="/contact#grievance">
            Our grievance officer
          </Link>{" "}
          — a named person, with a phone number, a postal address and the windows we
          answer in
        </span>
      </div>

      <div className="rows__row">
        <span className="rows__k">Also read</span>
        <span className="rows__v">
          {others.map((o, i) => (
            <span key={o.key}>
              {i > 0 && " · "}
              <Link className="link link--accent" href={o.href}>
                {o.label}
              </Link>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
