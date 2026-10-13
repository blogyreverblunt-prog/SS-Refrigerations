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
  },

  /* ------------------------------------------------------------- channels */
  contact: {
    /** TEMPLATE — sales enquiries. */
    salesPhone: "+91 00000 00000",
    /** TEMPLATE — service helpline. Published at the top of /support. */
    servicePhone: "+91 00000 00000",
    /** TEMPLATE — digits only, no +, no spaces. Used for wa.me links. */
    whatsapp: "910000000000",
    /** TEMPLATE */
    salesEmail: "sales@example.com",
    /** Customer support. Real — published on /support, /terms and /cookies. */
    serviceEmail: "managekalt@gmail.com",
    /** TEMPLATE */
    careersEmail: "careers@example.com",
    /** TEMPLATE — the address a DPDP data request goes to. */
    privacyEmail: "privacy@example.com",
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

  social: {
    /**
     * TEMPLATE — "#" renders the icon without a link target.
     *
     * Four marks in the footer, in this order. Facebook, Instagram and
     * LinkedIn are the three a buyer actually checks before enquiring; the
     * YouTube mark stays because a product demo is the obvious next thing
     * this catalogue will want to link to.
     */
    facebook: "#",
    instagram: "#",
    linkedin: "#",
    youtube: "#",
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

/** `wa.me` deep link with an optional pre-filled first message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.contact.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** `tel:` href from a display number written with spaces. */
export function telLink(display: string): string {
  return `tel:${display.replace(/[^+\d]/g, "")}`;
}
