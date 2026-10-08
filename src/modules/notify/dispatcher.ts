/**
 * NotificationDispatcher — Chain of Responsibility over the registered
 * channels.
 *
 * It asks each channel in priority order whether it can handle the
 * notification, and sends through the first that says yes. If that channel
 * throws, it falls through to the next rather than giving up: a Telegram
 * outage must not also lose the email copy.
 *
 * The dispatcher knows nothing about WhatsApp windows or daily email caps —
 * each channel owns its own policy in `canHandle`. That is what keeps this
 * class from growing a switch statement as channels are added.
 */
import type { Logger, Notification, NotificationChannel } from "@/core";

export interface DispatchResult {
  readonly delivered: boolean;
  /** Channels that accepted and succeeded, in order. */
  readonly via: readonly string[];
  /** Channels that accepted but failed. Present even on success. */
  readonly failures: readonly { channel: string; error: string }[];
}

export class NotificationDispatcher {
  private readonly channels: NotificationChannel[] = [];

  constructor(private readonly logger: Logger) {}

  /**
   * Registration order IS priority order. The composition root registers
   * WhatsApp before email so a customer gets the free channel when the
   * window allows it.
   */
  register(...channels: NotificationChannel[]): this {
    this.channels.push(...channels);
    return this;
  }

  /** Visible for diagnostics and the guardrail report. */
  registered(): readonly string[] {
    return this.channels.map((c) => c.name);
  }

  /**
   * Send through the first willing channel.
   *
   * Never throws: this runs inside a queue worker, and the worker's own
   * retry is driven by the outbox, not by an exception escaping here.
   */
  async dispatch(notification: Notification): Promise<DispatchResult> {
    const failures: { channel: string; error: string }[] = [];

    for (const channel of this.channels) {
      if (!channel.canHandle(notification)) continue;

      try {
        await channel.send(notification);
        return { delivered: true, via: [channel.name], failures };
      } catch (cause) {
        const error = cause instanceof Error ? cause.message : String(cause);
        failures.push({ channel: channel.name, error });
        this.logger.log("warn", "notification channel failed; trying next", {
          channel: channel.name,
          audience: notification.audience,
          error,
        });
      }
    }

    this.logger.log("error", "no channel delivered the notification", {
      audience: notification.audience,
      subject: notification.subject,
      tried: failures.map((f) => f.channel),
    });

    return { delivered: false, via: [], failures };
  }

  /**
   * Send to every willing channel rather than stopping at the first.
   * Used where redundancy beats economy — a lost RFQ is worth more than a
   * duplicate alert.
   */
  async broadcast(notification: Notification): Promise<DispatchResult> {
    const via: string[] = [];
    const failures: { channel: string; error: string }[] = [];

    for (const channel of this.channels) {
      if (!channel.canHandle(notification)) continue;
      try {
        await channel.send(notification);
        via.push(channel.name);
      } catch (cause) {
        failures.push({
          channel: channel.name,
          error: cause instanceof Error ? cause.message : String(cause),
        });
      }
    }

    return { delivered: via.length > 0, via, failures };
  }
}
