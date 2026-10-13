/**
 * The validation boundary for registration and sign-in.
 *
 * Same contract as the leads module: everything crossing into the domain is
 * parsed once, here, and normalised as part of parsing — so a service method
 * receives a value already known to be well-formed, with the email already
 * lowercased and the phone already in E.164.
 */
import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, { message: "Enter your email address" })
  .max(254, { message: "That email address is too long" })
  .email({ message: "Enter a valid email address" });

/**
 * Indian mobile numbers, tolerantly — the same rule the enquiry forms use, so
 * one person's number is stored identically whether they registered or just
 * sent an enquiry.
 */
const phone = z
  .string()
  .trim()
  .transform((raw) => raw.replace(/[\s\-().]/g, ""))
  .refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v) || /^\+[1-9]\d{7,14}$/.test(v), {
    message: "Enter a valid phone number",
  })
  .transform((v) => (v.startsWith("+") ? v : `+91${v.replace(/^91/, "")}`));

/**
 * Length, and nothing else.
 *
 * No "must contain a symbol" rule, deliberately: composition rules push
 * people towards Password1! and towards reuse, which is the failure that
 * actually happens. NIST dropped them in SP 800-63B for that reason. Twelve
 * characters with no other constraint is both stronger and easier to comply
 * with, and the 200-character ceiling exists only so nobody can post a
 * megabyte of text into scrypt.
 */
const password = z
  .string()
  .min(12, { message: "Use at least 12 characters — a short phrase is ideal" })
  .max(200, { message: "That password is too long" });

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, { message: "Tell us your name" }).max(120),
  email,
  password,
  /**
   * Required, unlike on the enquiry forms.
   *
   * An account is the party an order gets attached to, and a commercial
   * refrigeration order is settled by phone — a delivery slot, a site
   * measurement, an engineer at the gate. An account with no number on it is
   * one we cannot service, so it is asked for once here rather than chased
   * later. Google sign-in is the exception and has no number at all; that is
   * the price of one-click, and it is asked for at checkout instead.
   */
  phone,
  company: z.string().trim().max(160).optional(),
  /**
   * Hidden field. A browser leaves it empty; a bot fills everything it finds.
   * Same trick the enquiry forms use.
   */
  website: z.string().max(0).optional(),
});

export const loginInputSchema = z.object({
  email,
  /**
   * Not the registration rule. A customer who registered before the minimum
   * changed must still be able to sign in — validating the length of a
   * password that already exists only locks out the person who owns it.
   */
  password: z.string().min(1, { message: "Enter your password" }).max(200),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;

export interface AuthRequestContext {
  readonly ip: string | null;
  readonly userAgent: string | null;
}
