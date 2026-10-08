/**
 * Resend.  Seam 11 (fallback leg).
 *
 * Email is deliberately the FALLBACK, not the primary customer channel.
 * Resend's free tier is 3,000/month but only 100/DAY, and that daily wall
 * silently drops the 101st acknowledgement. Moving acks to WhatsApp took the
 * projection from 86/day to ~22/day (HLD-FREE-TIER.md §3.4), which turned the
 * single most likely free-tier failure into a non-issue.
 */
import { Resend } from "resend";

import { NotConfiguredError, UpstreamError } from "@/core";
import type { MailMessage, MailPort } from "@/core";
import { capabilities, env } from "../env";

export class ResendMailAdapter implements MailPort {
  private client: Resend | null = null;

  async send(message: MailMessage): Promise<void> {
    if (!capabilities.mail) {
      throw new NotConfiguredError("mail", ["RESEND_API_KEY"]);
    }
    this.client ??= new Resend(env.RESEND_API_KEY!);

    const { error } = await this.client.emails.send({
      from: env.MAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });

    if (error) {
      throw new UpstreamError("resend", error.message ?? "send failed", error);
    }
  }
}

/**
 * Logs instead of sending. Used in development and in CI so the lead path can
 * be exercised end to end without a provider account or burning daily quota.
 */
export class ConsoleMailAdapter implements MailPort {
  async send(message: MailMessage): Promise<void> {
    console.log(
      JSON.stringify({
        level: "info",
        message: "mail (console adapter — not sent)",
        to: message.to,
        subject: message.subject,
      }),
    );
  }
}
