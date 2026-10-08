/**
 * The validation boundary for inbound enquiries.
 *
 * Everything crossing into the domain is parsed here, once. Nothing
 * downstream re-checks shape, so a `LeadInput` is a value that is already
 * known to be well-formed — that is what keeps the service readable.
 *
 * Normalisation happens as part of parsing (trim, lowercase email, strip
 * phone formatting) so two spellings of the same enquiry dedupe correctly.
 */
import { z } from "zod";

import { LEAD_TYPE } from "@/db/schema";

/* -------------------------------------------------------------------------
 * Field-level rules
 * ---------------------------------------------------------------------- */

/**
 * Indian mobile numbers, tolerantly. Accepts +91, 0-prefixed and bare
 * 10-digit forms and normalises to E.164, because a buyer typing their own
 * number three different ways must not create three leads.
 */
const phone = z
  .string()
  .trim()
  .transform((raw) => raw.replace(/[\s\-().]/g, ""))
  .refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v) || /^\+[1-9]\d{7,14}$/.test(v), {
    message: "Enter a valid phone number",
  })
  .transform((v) => {
    if (v.startsWith("+")) return v;
    const local = v.replace(/^91/, "");
    return `+91${local}`;
  });

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

/** Attribution. Unknown keys are dropped rather than trusted. */
const source = z
  .object({
    utmSource: z.string().max(128).optional(),
    utmMedium: z.string().max(128).optional(),
    utmCampaign: z.string().max(128).optional(),
    referrer: z.string().max(512).optional(),
    landingPath: z.string().max(512).optional(),
  })
  .strip()
  .default({});

/* -------------------------------------------------------------------------
 * The quote cart
 * ---------------------------------------------------------------------- */

export const leadItemSchema = z.object({
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  qty: z.coerce.number().int().min(1).max(999).default(1),
  note: z.string().trim().max(500).optional(),
});

/* -------------------------------------------------------------------------
 * The enquiry
 * ---------------------------------------------------------------------- */

export const leadInputSchema = z
  .object({
    type: z.enum(LEAD_TYPE).default("contact"),
    name: z.string().trim().min(2, "Tell us your name").max(120),
    email,
    phone: phone.optional(),
    company: z.string().trim().max(160).optional(),
    city: z.string().trim().max(120).optional(),
    message: z.string().trim().max(4000).optional(),
    items: z.array(leadItemSchema).max(50).default([]),
    source,

    /** DPDP: an explicit, logged act of consent. Not a pre-ticked box. */
    consent: z.literal(true, {
      errorMap: () => ({ message: "Please accept the privacy notice to continue" }),
    }),

    /** Bot defence. Verified against Cloudflare before anything is written. */
    captchaToken: z.string().optional(),

    /**
     * Honeypot. A real browser leaves it empty; a naive bot fills every
     * input it finds.
     *
     * Deliberately NOT `.max(0)`: rejecting it here returns a validation
     * error naming `website`, which tells the bot exactly which field is
     * the trap. It is accepted as any string and discarded silently in
     * LeadService, so a bot sees an ordinary success and has nothing to
     * tune against.
     */
    website: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    // An RFQ without line items is a contact enquiry wearing the wrong hat,
    // and would produce a quote request nobody can price.
    if (value.type === "rfq" && value.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "A quote request needs at least one product",
      });
    }
    // Reaching someone requires a channel. Email is required above, but a
    // callback by definition needs the phone.
    if (value.type === "callback" && !value.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "A callback request needs a phone number",
      });
    }
  });

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadItemInput = z.infer<typeof leadItemSchema>;

/** Request context the transport layer supplies; never user-controlled. */
export interface LeadRequestContext {
  readonly ip: string | null;
  readonly userAgent: string | null;
  readonly idempotencyKey: string | null;
}
