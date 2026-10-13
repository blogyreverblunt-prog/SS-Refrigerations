/**
 * site.ts — THE ONE FILE TO EDIT WITH REAL COMPANY DETAILS.
 *
 * Every phone number, address, GSTIN, certificate, warranty term, AMC plan
 * and service city on the website comes from here. No page hard-codes a
 * business fact, so filling this file in is the whole of "go live" as far as
 * company information is concerned.
 *
 * `isTemplate: true` makes every placeholder render a small TEMPLATE badge
 * next to it. Set it to `false` once the values below are real and the badges
 * disappear site-wide — nothing else needs touching.
 *
 * Marketing copy is NOT here. Product copy lives in the database (see
 * src/db/schema/catalog.ts); page prose lives in the page that shows it.
 * This file is facts only.
 */

export const site = {
  /** Flip to false when the values below are real. Controls the TEMPLATE badges. */
  isTemplate: true,

  brand: {
    /** Shown in the nav, the footer and every page title. */
    name: "SS Refrigeration",
    /** Second line of the wordmark, uppercase, letter-spaced. */
    sub: "Refrigeration",
    /** Short form for the wordmark's first line. */
    short: "SS",
    tagline: "Reliable. Efficient. Precise.",
    /** One sentence, used in the footer and as the default meta description. */
    blurb: "Commercial refrigeration for professional kitchens across India.",
  },

  /* ---------------------------------------------------------------- legal */
  legal: {
    /** TEMPLATE — registered name as it appears on the GST certificate. */
    entity: "SS Refrigeration Private Limited",
    /** TEMPLATE */
    gstin: "00AAAAA0000A0Z0",
    /** TEMPLATE — CIN, if a private limited company. */
    cin: "U00000XX0000PTC000000",
    /** TEMPLATE — year the business started trading. */
    since: "20XX",

    /**
     * TEMPLATE — the courts named in the jurisdiction clause on /terms.
     *
     * A governing-law clause that reads "the courts at [city]" is worse than
     * none: it tells a buyer's legal team the page was never finished. Name
     * the place the registered office is actually in.
     */
    jurisdiction: "Pune, Maharashtra",

    /**
     * The effective date printed on /privacy, /terms and /cookies.
     *
     * All three reference sites date their policies, and an undated policy
     * cannot be relied on by anybody — a visitor cannot tell whether it
     * covers what was done with their data last year. Bump this whenever the
     * substance of any of the three changes.
     */
    policyUpdated: "13 October 2026",

    /**
     * TEMPLATE — a named person, not a department.
     *
     * Two separate Indian regimes require this and neither is satisfied by a
     * shared inbox: the DPDP Act 2023 wants a grievance route for data
     * principals, and the Consumer Protection (E-Commerce) Rules 2020 want a
     * named grievance officer with a published contact and a stated
     * resolution window.
     */
    grievanceOfficer: {
      name: "Name of the officer",
      designation: "Grievance Officer",
      email: "managekalt@gmail.com",
      phone: "+91 00000 00000",
      /** The windows the Consumer Protection rules expect you to state. */
      acknowledgeWithin: "48 hours",
      resolveWithin: "one month",
    },
  },

  /* ------------------------------------------------------------- channels */
  contact: {
    /** TEMPLATE — sales enquiries. */
    salesPhone: "+91 00000 00000",
    /** TEMPLATE — service helpline. Published at the top of /support. */
    servicePhone: "+91 00000 00000",
    /** TEMPLATE — digits only, no +, no spaces. Used for wa.me links. */
    whatsapp: "910000000000",
    /*
      One real inbox, four names.

      managekalt@gmail.com is a working address, so these carry no TEMPLATE
      badge — anyone who writes to any of them is reached. They stay four
      separate fields rather than one so that splitting them later (sales@,
      service@, careers@, privacy@ on the company domain) is four edits here
      and no edits anywhere else.
    */
    salesEmail: "managekalt@gmail.com",
    /** Customer support. Published on /support, /terms and /cookies. */
    serviceEmail: "managekalt@gmail.com",
    careersEmail: "managekalt@gmail.com",
    /** The address a DPDP data request goes to. */
    privacyEmail: "managekalt@gmail.com",
    hours: "Mon–Sat, 9:00 am – 7:00 pm IST",
    /** Stated beside every form. Keep it a promise you can keep. */
    responseTime: "within one working day",
  },

  /** TEMPLATE — one entry per address. The first is used as the primary. */
  offices: [
    {
      label: "Registered office",
      lines: ["Address line 1", "Address line 2", "City, State 000000", "India"],
      phone: "+91 00000 00000",
      /** Google Maps embed or share URL. Empty renders a placeholder tile. */
      mapUrl: "",
    },
    {
      label: "Works / warehouse",
      lines: ["Plot 00, Industrial Area", "City, State 000000", "India"],
      phone: "+91 00000 00000",
      mapUrl: "",
    },
  ],

  /**
   * TEMPLATE — "#" means "no URL yet".
   *
   * Four marks, in this order. Facebook, Instagram and LinkedIn are the three
   * a buyer actually checks before enquiring — all three reference sites
   * carry them and Fhiaba carries only them — and the YouTube mark stays
   * because a product demo is the obvious next thing this catalogue will want
   * to link to.
   *
   * While a value is "#" the mark renders as a real, focusable control that
   * deliberately goes nowhere (src/components/social.tsx). Paste a URL in and
   * the same mark becomes a link to it, opening in a new tab.
   */
  social: {
    facebook: "#",
    instagram: "#",
    linkedin: "#",
    youtube: "#",
  },

  /**
   * TEMPLATE — the commercial terms /terms states.
   *
   * These are the clauses a buyer's purchase desk reads before raising a PO,
   * and the ones U-Line and Marvel both carry as a separate shipping-and-
   * returns page. Every one is a number somebody in the business has to
   * stand behind, so they live here rather than buried in prose.
   */
  orders: {
    quoteValidity: "30 days from the date of issue",
    gst: "Exclusive of GST unless the quotation says otherwise",
    advance: "50% with the order, balance before dispatch",
    leadTime: "3–5 working days ex-stock; 3–4 weeks built-to-order",
    freight: "Quoted as a separate line; included only where the quotation says so",
    /** Transit damage stops being claimable once a clean receipt is signed. */
    transitDamageWindow: "48 hours of delivery",
    cancellation: "Within 7 days of order confirmation, provided fabrication has not started",
    cancellationFee: "Standard models: no charge. Built-to-order and cold rooms: at cost incurred",
    returns: "Unused standard models within 7 days of delivery, in original packing",
    noReturns: "Built-to-order cabinets, cold rooms and commissioned installations",
  },

  /* --------------------------------------------------------------- proof */

  /**
   * The three chips above the fold on /about, after Climatrol's set:
   * certification, service reach, manufacturing. TEMPLATE values.
   */
  proof: [
    "ISO 9001:2015 certified",
    "Service in 00+ cities",
    "In-house design & assembly",
  ],

  /** TEMPLATE — /about §numbers. Each one a number, never an adjective. */
  numbers: [
    { value: "00+", label: "Years in refrigeration" },
    { value: "00", label: "Models in the range" },
    { value: "0,000+", label: "Cabinets commissioned" },
    { value: "00", label: "Cities with engineers" },
    { value: "00,000 sq ft", label: "Manufacturing area" },
  ],

  /** TEMPLATE — logos go in public/certs, one line of copy each. */
  certifications: [
    { name: "ISO 9001:2015", note: "Quality management system" },
    { name: "BIS / ISI", note: "Indian standards conformity" },
    { name: "CE", note: "For the export range" },
    { name: "BEE star rating", note: "Where the category is covered" },
    { name: "RoHS / e-waste", note: "E-waste (Management) Rules compliance" },
  ],

  /* ------------------------------------------------------------- service */

  /**
   * TEMPLATE — the city list is the credible form of "pan-India service".
   * A plain list of cities you can actually reach beats the phrase.
   */
  serviceCities: [
    "Mumbai", "Pune", "Nashik", "Ahmedabad", "Surat", "Delhi NCR",
    "Jaipur", "Lucknow", "Kanpur", "Indore", "Bhopal", "Nagpur",
    "Kolkata", "Patna", "Guwahati", "Bhubaneswar", "Hyderabad",
    "Bengaluru", "Chennai", "Kochi",
  ],

  /** TEMPLATE — one row per plan on /support#amc. */
  amcPlans: [
    {
      name: "Comprehensive AMC",
      covers: "Scheduled visits, labour, gas top-up and genuine spares",
      visits: "4 preventive visits a year, unlimited breakdown calls",
      best: "Single-site kitchens running the cabinet all day",
    },
    {
      name: "Labour-only AMC",
      covers: "Scheduled visits and labour; parts billed at list",
      visits: "2 preventive visits a year, unlimited breakdown calls",
      best: "Buyers who hold their own spares",
    },
    {
      name: "Per-call service",
      covers: "Visit charge plus parts and labour on the invoice",
      visits: "On request",
      best: "Out-of-warranty, low-usage units",
    },
  ],

  /** TEMPLATE — stated plainly because it closes deals. One row per line. */
  warranty: [
    { range: "Reach-in & undercounter cabinets", parts: "1 year", compressor: "5 years", labour: "1 year" },
    { range: "Glass door & visi coolers", parts: "1 year", compressor: "5 years", labour: "1 year" },
    { range: "Display cases", parts: "1 year", compressor: "3 years", labour: "1 year" },
    { range: "Deep freezers", parts: "1 year", compressor: "5 years", labour: "1 year" },
    { range: "Walk-in cold rooms", parts: "1 year", compressor: "2 years", labour: "On the AMC" },
  ],
} as const;

export type Site = typeof site;

/**
 * An open product safety notice.
 *
 * U-Line keeps a permanent recall URL in its footer whether or not anything
 * is open, and that is the right shape: someone running due diligence on a
 * supplier looks for it, and "none open, here is how we would tell you"
 * answers the question. Finding no page at all does not.
 */
export interface SafetyNotice {
  /** Your own reference, so a caller and an engineer quote the same thing. */
  readonly ref: string;
  readonly issued: string;
  /** Model codes and the serial range affected. */
  readonly models: string;
  readonly summary: string;
  /** What the owner should do, in one sentence, starting with a verb. */
  readonly action: string;
}

/** None open. Add a row and /support#safety publishes it. */
export const safetyNotices: readonly SafetyNotice[] = [];

/** `wa.me` deep link with an optional pre-filled first message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.contact.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** `tel:` href from a display number written with spaces. */
export function telLink(display: string): string {
  return `tel:${display.replace(/[^+\d]/g, "")}`;
}
