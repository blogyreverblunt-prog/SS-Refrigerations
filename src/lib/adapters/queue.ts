/**
 * Upstash QStash.  Seam 6.
 *
 * The contract that matters (HLD-FREE-TIER.md §3.2): `publish` NEVER THROWS.
 *
 * By the time anything is enqueued, the business row and its outbox row are
 * already committed. If QStash is down, over quota, or slow, the correct
 * behaviour is to record that and carry on — the sweeper will deliver it late.
 * An exception here would turn a delivery delay into a failed user request,
 * which is exactly the coupling the outbox pattern exists to prevent.
 */
import { Client } from "@upstash/qstash";
import { Receiver } from "@upstash/qstash";

import { ConsoleLogger, UnauthorizedError } from "@/core";
import type { JobTask, Logger, QueuePort, QueueVerifierPort } from "@/core";
import { capabilities, env } from "../env";

export class QStashQueueAdapter implements QueuePort {
  private client: Client | null = null;

  constructor(private readonly logger: Logger = new ConsoleLogger({ adapter: "qstash" })) {}

  async publish(task: JobTask, payload: unknown): Promise<boolean> {
    if (!capabilities.queue) {
      // Not an error. Locally and in CI there is no queue, and the sweeper
      // is the designed fallback for precisely this situation.
      this.logger.log("debug", "queue not configured; relying on sweeper", { task });
      return false;
    }

    try {
      this.client ??= new Client({ token: env.QSTASH_TOKEN! });
      await this.client.publishJSON({
        url: `${env.APP_URL}/api/jobs/${task}`,
        body: payload,
        retries: 3,
      });
      return true;
    } catch (cause) {
      this.logger.log("warn", "queue publish failed; sweeper will retry", {
        task,
        error: cause instanceof Error ? cause.message : String(cause),
      });
      return false;
    }
  }
}

/**
 * Verifies inbound job callbacks.
 *
 * Split from QueuePort on purpose (Interface Segregation): the lead path
 * enqueues and never verifies, the job route verifies and never enqueues.
 * Neither should depend on the other's capability.
 *
 * QStash rotates between a current and a next signing key, so verification
 * must accept either — checking only one causes a mysterious outage on the
 * day they rotate.
 */
export class QStashVerifier implements QueueVerifierPort {
  private receiver: Receiver | null = null;

  async verify(signature: string | null, rawBody: string, url: string): Promise<void> {
    if (!capabilities.queueSignature) {
      // Fail closed in production; allow local job invocation in development.
      if (capabilities.isProduction) {
        throw new UnauthorizedError("Queue signature verification is not configured");
      }
      return;
    }
    if (!signature) throw new UnauthorizedError("Missing QStash signature");

    this.receiver ??= new Receiver({
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const valid = await this.receiver
      .verify({ signature, body: rawBody, url })
      .catch(() => false);

    if (!valid) throw new UnauthorizedError("Invalid QStash signature");
  }
}
