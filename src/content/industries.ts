/**
 * Industry copy, keyed by the slugs `scripts/seed.ts` writes into the
 * `industry` table.
 *
 * In git rather than in the database, deliberately: this is marketing copy
 * with a fixed shape, and the HLD is explicit that only *structured* content
 * needs a table (src/db/schema/content.ts). The database still owns the
 * product↔industry tagging — `product_industry` — so a model can be filed
 * under an industry without an editor touching this file.
 *
 * Buyers self-identify by business type, not by equipment category: a bakery
 * owner searches "bakery display cabinet", not "undercounter refrigerator".
 * Each entry below exists to translate one of those searches into product.
 */

export interface Industry {
  readonly slug: string;
  readonly name: string;
  /** The cooling problem this business has, in two or three sentences. */
  readonly problem: string;
  /** What the equipment has to do about it. */
  readonly needs: readonly string[];
  /** Working band, stated in °C because every buyer here thinks in °C. */
  readonly band: string;
  /** Product slugs, in the order they should be recommended. */
  readonly products: readonly { readonly slug: string; readonly label: string }[];
  readonly photo: string;
}

export const INDUSTRIES: readonly Industry[] = [
  {
    slug: "restaurants-qsr",
    name: "Restaurants, QSR & Cloud Kitchens",
    problem:
      "A service line opens and closes forty times an hour, and every door opening is a heat load. The cabinets under the counter have to recover between covers, in a kitchen that is already 40 °C, without pushing the compressor into a duty cycle it cannot hold.",
    needs: [
      "Pull-down fast enough to survive a dinner service",
      "700 mm depth, so it drops into an existing run without rework",
      "Field-reversible doors for a line that gets rearranged",
      "Castors, because the floor behind gets cleaned nightly",
    ],
    band: "+2 to +8 °C, with −18 °C for the freezer side",
    products: [
      { slug: "undercounter-refrigerator", label: "Undercounter & worktop" },
      { slug: "reach-in-refrigerator", label: "Reach-in cabinets" },
      { slug: "deep-freezer", label: "Deep freezers" },
    ],
    photo: "/photos/industry-qsr-800.webp",
  },
  {
    slug: "bakery-patisserie",
    name: "Bakery, Patisserie & Confectionery",
    problem:
      "Cream does not forgive temperature drift and a glaze does not forgive dry air. Display is half the product: the cabinet has to hold humidity and look like the shop's best fixture, under lighting, all day, with the glass staying clear.",
    needs: [
      "High-humidity holding so a glaze does not dull",
      "Even shelf-to-shelf temperature under display lighting",
      "Glass that stays clear in a monsoon-humid shop",
      "Trays and shelves sized to a standard bakery tray",
    ],
    band: "+2 to +10 °C display, −18 °C for frozen dough",
    products: [
      { slug: "sushi-display-case", label: "Display cases & showcases" },
      { slug: "glass-door-refrigerator", label: "Glass door merchandisers" },
      { slug: "deep-freezer", label: "Deep freezers" },
    ],
    photo: "/photos/industry-bakery-800.webp",
  },
  {
    slug: "supermarket-retail",
    name: "Supermarket & Retail",
    problem:
      "A merchandiser earns its floor space or it loses it. The cabinet has to sell the product through the glass, survive customers leaning on the door all day, and not add a visible line to the electricity bill — which in a store running sixteen hours is the number that decides the purchase.",
    needs: [
      "Visibility: lit, full-height facings and clear glass",
      "Energy consumption measured, not claimed",
      "Branding panels for beverage and dairy partners",
      "Lockable doors and a night blind where the format needs one",
    ],
    band: "+2 to +10 °C chilled, −18 to −22 °C frozen",
    products: [
      { slug: "glass-door-refrigerator", label: "Visi coolers & merchandisers" },
      { slug: "deep-freezer", label: "Glass-top freezers" },
      { slug: "walk-in-refrigerator", label: "Walk-in cold rooms" },
    ],
    photo: "/photos/retail-merchandiser-800.webp",
  },
  {
    slug: "hotels-institutional",
    name: "Hotels, Banqueting & Institutional",
    problem:
      "Banqueting is bulk: a 400-cover function needs the whole menu held cold at once, then the same kitchen goes quiet for two days. Storage has to be big, uniform and auditable, because a food-safety log with a gap in it is a failed audit.",
    needs: [
      "Bulk capacity in cold rooms and three-section cabinets",
      "Uniform temperature loaded, not just empty",
      "A temperature record that survives an audit",
      "Service response that matches a 24-hour operation",
    ],
    band: "0 to +8 °C, −18 °C bulk frozen",
    products: [
      { slug: "walk-in-refrigerator", label: "Walk-in cold rooms" },
      { slug: "reach-in-refrigerator", label: "Bulk reach-ins" },
      { slug: "deep-freezer", label: "Deep freezers" },
    ],
    photo: "/photos/ind-central-800.webp",
  },
  {
    slug: "healthcare-pharma",
    name: "Healthcare & Pharma",
    problem:
      "Here the cabinet is a compliance instrument. A vaccine excursion is a destroyed batch and a reportable event, so what matters is not the average temperature but the worst reading in the worst corner during a power cut — and the proof that you have it.",
    needs: [
      "Tight, logged uniformity with an alarm on excursion",
      "Hold-over through an outage, with battery-backed monitoring",
      "Validation and calibration documents on file",
      "Ultra-low duty down to −60 °C where the product needs it",
    ],
    band: "+2 to +8 °C pharmacy, −20 °C and −60 °C ultra-low",
    products: [
      { slug: "deep-freezer", label: "Ultra-low temperature freezers" },
      { slug: "reach-in-refrigerator", label: "Upright cabinets" },
      { slug: "glass-door-refrigerator", label: "Glass door units" },
    ],
    photo: "/photos/pop-appliance-800.webp",
  },
  {
    slug: "icecream-dairy-beverage",
    name: "Ice Cream, Dairy & Beverage",
    problem:
      "Ice cream is unforgiving: a few degrees of drift and the texture is gone before the customer opens the lid. These cabinets also sit in shops with a 230 V supply that sags in summer, which is where most of them fail.",
    needs: [
      "Stable −22 °C or colder through a sagging supply",
      "Glass-top and hard-top formats for the counter you have",
      "Branding and scoop-ready layouts for parlours",
      "Bottle and milk coolers for the front of house",
    ],
    band: "−18 to −24 °C, parlour cabinets to −26 °C",
    products: [
      { slug: "deep-freezer", label: "Deep freezers" },
      { slug: "glass-door-refrigerator", label: "Bottle & beverage coolers" },
      { slug: "undercounter-refrigerator", label: "Undercounter storage" },
    ],
    photo: "/photos/pop-merchandiser-800.webp",
  },
];
