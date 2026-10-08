/**
 * The outbox module's ONLY public surface.
 *
 * HLD-FREE-TIER.md §5.2: nothing outside this folder may import its
 * internals. ESLint enforces that by banning deep imports under
 * `@/modules/<name>/...`, so the boundary is a build error rather than a
 * convention somebody has to remember.
 */
export { OutboxRepository } from "./repository";
export type {
  Executor,
  NewOutboxEvent,
  OutboxRecord,
  OutboxRepositoryPort,
} from "./repository";

export { OutboxPublisher } from "./publisher";
export { OutboxSweeper, WORK_PENDING_KEY } from "./sweeper";
export type { SweepReport } from "./sweeper";
