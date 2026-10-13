/**
 * The accounts module's public surface.
 *
 * Routes and pages import from here; nothing outside reaches into the files
 * behind it. The container is the only place allowed to construct the service.
 */
export { AccountService } from "./service";
export type { AccountServiceDeps, SignedIn } from "./service";
export { AccountRepository } from "./repository";
export type {
  AccountRepositoryPort,
  CustomerRecord,
  CustomerWithSecret,
} from "./repository";
export {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  clearedSessionCookie,
  sessionCookie,
} from "./session";
export { loginInputSchema, registerInputSchema } from "./schema";
export type { AuthRequestContext, LoginInput, RegisterInput } from "./schema";
