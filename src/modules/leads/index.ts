/** Public surface of the leads module. Nothing else may be imported. */
export { LeadService } from "./service";
export type { LeadAccepted, LeadServiceDeps } from "./service";

export { LeadRepository } from "./repository";
export type { LeadRepositoryPort, LeadSummary, PersistLeadCommand } from "./repository";

export {
  InMemorySequence,
  LeadReferenceGenerator,
  PostgresSequence,
} from "./reference";
export type { SequenceSource } from "./reference";

export { leadInputSchema, leadItemSchema } from "./schema";
export type { LeadInput, LeadItemInput, LeadRequestContext } from "./schema";
