/**
 * Notification channels.  Seam 11.
 *
 * Each channel is a Strategy implementing the same `NotificationChannel`
 * port. The dispatcher picks between them at runtime; adding SMS tomorrow
 * means writing one class and registering it, with no existing file edited
 * (Open/Closed).
 *
 * The policy that makes this non-trivial (HLD-FREE-TIER.md §3.4): WhatsApp
 * Cloud API gives 1,000 FREE service messages a month, but a free-form reply
 * is only allowed inside a 24-hour window THE CUSTOMER opened. So the channel
 * cannot simply be "preferred" — it has to declare, per notification, whether
 * it is allowed to act. That is what `canHandle` is for.
 */
import { UpstreamError } from "@/core";
import type { Logger, MailPort, Notification, NotificationChannel } from "@/core";
import { capabilities, env } from "@/lib/env";

/* -------------------------------------------------------------------------
 * Telegram — the sales desk
 * ---------------------------------------------------------------------- */

/**
 * Replaces ~80 notification emails a day with a free, unlimited push that
 * the sales desk actually reads. Internal only: never used for customers.
 */
export class TelegramChannel implements NotificationChannel {
  readonly name = "telegram";

  constructor(private readonly logger: Logger) {}

  canHandle(notification: Notification): boolean {
    return notification.audience === "sales" && capabilities.telegram;
  }

  async send(notification: Notification): Promise<void> {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: `*${notification.subject}*\n\n${notification.body}`,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8_000),
    }).catch((cause: unknown) => {
      throw new UpstreamError("telegram", "request failed", cause);
    });

    if (!res.ok) {
      throw new UpstreamError("telegram", `HTTP ${res.status}`, await res.text());
    }
    this.logger.log("debug", "telegram notification sent");
  }
}

/* -------------------------------------------------------------------------
 * WhatsApp — the primary customer channel
 * ---------------------------------------------------------------------- */

export class WhatsAppChannel implements NotificationChannel {
  readonly name = "whatsapp";

  constructor(private readonly logger: Logger) {}

  canHandle(notification: Notification): boolean {
    if (notification.audience !== "customer") return false;
    if (!capabilities.whatsapp) return false;
    if (!notification.recipient?.phone) return false;
    // The 24-hour rule. Outside the window a free-form message is rejected
    // by Meta and a paid Utility template would be required instead.
    return notification.recipient.whatsappWindowOpen === true;
  }

  async send(notification: Notification): Promise<void> {
    const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: notification.recipient!.phone,
        type: "text",
        text: { body: `${notification.subject}\n\n${notification.body}` },
      }),
      signal: AbortSignal.timeout(8_000),
    }).catch((cause: unknown) => {
      throw new UpstreamError("whatsapp", "request failed", cause);
    });

    if (!res.ok) {
      throw new UpstreamError("whatsapp", `HTTP ${res.status}`, await res.text());
    }
    this.logger.log("debug", "whatsapp notification sent");
  }
}

/* -------------------------------------------------------------------------
 * Email — the fallback
 * ---------------------------------------------------------------------- */

/**
 * Handles both audiences, and is last in the chain for customers. Its daily
 * cap (100 on the Resend free tier) is the reason it is not the default.
 */
export class EmailChannel implements NotificationChannel {
  readonly name = "email";

  constructor(
    private readonly mail: MailPort,
    private readonly logger: Logger,
  ) {}

  canHandle(notification: Notification): boolean {
    if (!capabilities.mail) return false;
    return notification.audience === "sales"
      ? Boolean(env.SALES_INBOX)
      : Boolean(notification.recipient?.email);
  }

  async send(notification: Notification): Promise<void> {
    const to =
      notification.audience === "sales"
        ? env.SALES_INBOX!
        : notification.recipient!.email!;

    await this.mail.send({
      to,
      subject: notification.subject,
      html: notification.html ?? `<pre>${escapeHtml(notification.body)}</pre>`,
      text: notification.body,
    });
    this.logger.log("debug", "email notification sent", { audience: notification.audience });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Development sink. Registered last so the chain always resolves and the
 * lead path can be exercised with no provider configured at all.
 */
export class ConsoleChannel implements NotificationChannel {
  readonly name = "console";

  canHandle(): boolean {
    return true;
  }

  async send(notification: Notification): Promise<void> {
    console.log(
      JSON.stringify({
        level: "info",
        message: "notification (console sink)",
        audience: notification.audience,
        subject: notification.subject,
      }),
    );
  }
}
