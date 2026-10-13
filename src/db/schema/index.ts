/**
 * The schema barrel. Drizzle needs one object containing every table so it can
 * resolve relations and drive migrations; application code should still import
 * through a module's `index.ts` rather than reaching in here directly.
 */
export * from "./accounts";
export * from "./catalog";
export * from "./content";
export * from "./demand";
export * from "./platform";
