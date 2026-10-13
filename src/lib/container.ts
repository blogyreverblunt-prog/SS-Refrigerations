/**
 * container.ts — the composition root.
 *
 * THE ONLY FILE THAT KNOWS WHICH CONCRETE CLASS IMPLEMENTS WHICH PORT.
 *
 * Every module above receives its collaborators as interfaces through a
 * constructor, so this is where Dependency Inversion is actually paid for:
 * swapping QStash for SQS, or Resend for SES, is an edit here and nowhere
 * else. That is the mechanical meaning of the scaling-seams map — "seam 6 is
 * one line in lib/queue.ts" is true because of this file.
 *
 * Construction is LAZY and MEMOISED. A serverless invocation that only reads
 * the catalogue must not pay to construct a mail client, and the next
 * invocation on a warm instance should not rebuild the graph.
 */
import {
  ConsoleLogger,
  CryptoIdGenerator,
  SystemClock,
  type CachePort,
  type CaptchaVerifierPort,
  type Clock,
  type IdGenerator,
  type Logger,
  type MailPort,
  type QueuePort,
  type QueueVerifierPort,
  type RateLimiterPort,
  type StoragePort,
} from "@/core";

import { AccountRepository, AccountService } from "@/modules/accounts";
import { CatalogRepository } from "@/modules/catalog";
import {
  LeadReferenceGenerator,
  LeadRepository,
  LeadService,
  PostgresSequence,
} from "@/modules/leads";
import {
  ConsoleChannel,
  EmailChannel,
  NotificationDispatcher,
  TelegramChannel,
  WhatsAppChannel,
} from "@/modules/notify";
import { OutboxPublisher, OutboxRepository, OutboxSweeper } from "@/modules/outbox";

import { TurnstileVerifier } from "./adapters/captcha";
import { RedisCacheAdapter, UpstashRateLimiter } from "./adapters/cache";
import { ConsoleMailAdapter, ResendMailAdapter } from "./adapters/mail";
import { QStashQueueAdapter, QStashVerifier } from "./adapters/queue";
import { R2StorageAdapter, UnconfiguredStorageAdapter } from "./adapters/storage";
import { capabilities } from "./env";

/** Memoise a zero-arg factory. */
function once<T>(factory: () => T): () => T {
  let value: T | undefined;
  let built = false;
  return () => {
    if (!built) {
      value = factory();
      built = true;
    }
    return value as T;
  };
}

/* -------------------------------------------------------------------------
 * Ambient
 * ---------------------------------------------------------------------- */

const clock = once<Clock>(() => new SystemClock());
const ids = once<IdGenerator>(() => new CryptoIdGenerator());
const logger = once<Logger>(() => new ConsoleLogger({ app: "ss-refrigeration" }));

/* -------------------------------------------------------------------------
 * Adapters — the swap points
 * ---------------------------------------------------------------------- */

const storage = once<StoragePort>(() =>
  capabilities.storage ? new R2StorageAdapter() : new UnconfiguredStorageAdapter(),
);

const queue = once<QueuePort>(
  () => new QStashQueueAdapter(logger().child({ adapter: "qstash" })),
);

const queueVerifier = once<QueueVerifierPort>(() => new QStashVerifier());

const cache = once<CachePort>(
  () => new RedisCacheAdapter(logger().child({ adapter: "redis" })),
);

/**
 * 5 submissions per 10 minutes per hashed IP.
 *
 * Tuned for a real buyer, not a demo: a purchase manager legitimately sends
 * two or three enquiries in a sitting while comparing models. Turnstile is
 * the primary bot defence; this is the backstop against a script.
 */
const leadRateLimiter = once<RateLimiterPort>(
  () => new UpstashRateLimiter(5, "10 m", "rl:lead", logger().child({ adapter: "ratelimit" })),
);

/**
 * 10 attempts per 10 minutes per IP, across registration and sign-in.
 *
 * Looser than the lead bucket because a person who mistypes a password three
 * times is ordinary, and tighter than nothing because this is the one
 * endpoint on the site worth guessing at. The bucket name carries the action,
 * so a burst of registrations cannot exhaust somebody's sign-in allowance.
 */
const authRateLimiter = once<RateLimiterPort>(
  () => new UpstashRateLimiter(10, "10 m", "rl:auth", logger().child({ adapter: "ratelimit" })),
);

const mail = once<MailPort>(() =>
  capabilities.mail ? new ResendMailAdapter() : new ConsoleMailAdapter(),
);

/**
 * Always the real verifier, even when Turnstile is unconfigured.
 *
 * It decides for itself: in development an absent key means "pass", in
 * production it means "fail closed", because a production deployment with
 * no bot defence on the public lead form is a misconfiguration, not a
 * degradation. Selecting AlwaysPassCaptcha here on a missing key would
 * silently disable that check in production and leave the adapter's
 * fail-closed branch as dead code.
 *
 * AlwaysPassCaptcha stays for tests, which inject it directly.
 */
const captcha = once<CaptchaVerifierPort>(() => new TurnstileVerifier());

/* -------------------------------------------------------------------------
 * Repositories
 * ---------------------------------------------------------------------- */

const outboxRepo = once(() => new OutboxRepository(clock()));
const leadRepo = once(() => new LeadRepository());
const accountRepo = once(() => new AccountRepository());
const catalogRepo = once(() => new CatalogRepository());

/* -------------------------------------------------------------------------
 * Domain services
 * ---------------------------------------------------------------------- */

const outboxPublisher = once(
  () => new OutboxPublisher(queue(), cache(), logger().child({ module: "outbox" })),
);

const outboxSweeper = once(
  () =>
    new OutboxSweeper(
      outboxRepo(),
      queue(),
      cache(),
      logger().child({ module: "outbox.sweeper" }),
    ),
);

const leadReferences = once(
  () => new LeadReferenceGenerator(new PostgresSequence("lead_ref_seq"), clock()),
);

const leadService = once(
  () =>
    new LeadService({
      leads: leadRepo(),
      outbox: outboxRepo(),
      publisher: outboxPublisher(),
      captcha: captcha(),
      rateLimiter: leadRateLimiter(),
      cache: cache(),
      references: leadReferences(),
      clock: clock(),
      logger: logger().child({ module: "leads" }),
    }),
);

const accountService = once(
  () =>
    new AccountService({
      repository: accountRepo(),
      rateLimiter: authRateLimiter(),
      clock: clock(),
      logger: logger().child({ module: "accounts" }),
    }),
);

/**
 * REGISTRATION ORDER IS PRIORITY ORDER.
 *
 * Telegram first so the sales desk is alerted on the free, unlimited
 * channel. WhatsApp before email so a customer ack uses the free service
 * message whenever the 24-hour window allows, keeping Resend's 100/day cap
 * far away. Console last so the chain always resolves in development.
 */
const notifier = once(() => {
  const log = logger().child({ module: "notify" });
  const dispatcher = new NotificationDispatcher(log);
  dispatcher.register(
    new TelegramChannel(log),
    new WhatsAppChannel(log),
    new EmailChannel(mail(), log),
  );
  if (!capabilities.isProduction) dispatcher.register(new ConsoleChannel());
  return dispatcher;
});

/* -------------------------------------------------------------------------
 * The public container
 * ---------------------------------------------------------------------- */

export const container = {
  clock,
  ids,
  logger,
  storage,
  queue,
  queueVerifier,
  cache,
  mail,
  captcha,
  outboxRepo,
  outboxPublisher,
  outboxSweeper,
  leadRepo,
  leadService,
  accountRepo,
  accountService,
  catalogRepo,
  notifier,
} as const;

export type Container = typeof container;
