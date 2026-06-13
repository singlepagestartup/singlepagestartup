import { IRouteRule } from "@sps/shared-utils";

/**
 * Project-level routes that do NOT trigger a revalidation broadcast (startup
 * layer). (Project topic RULES live in `../startup.ts` — a distinct concept
 * from skip-routes.)
 *
 * UPGRADE SAFETY (issue #195): the PRIMARY, upgrade-safe extension seam is the
 * constructor-options path — `new RevalidationMiddleware({
 * notRevalidatingRoutes })` in `apps/api/app.ts`. Prefer it: it survives
 * base-module syncs untouched. This `startup.ts` file is ALSO project-owned
 * and preserved across syncs (the framework only ships `singlepage.ts`), so
 * editing it is safe too.
 *
 * Use a `deny` rule to SUBTRACT a framework default without forking
 * `singlepage.ts`:
 * export const notRevalidatingRoutes: IRouteRule[] = [
 *   { regexPath: /\/api\/crm\/internal-sync/, methods: ["POST"] },
 *   { regexPath: /some-default-skipped-route/, deny: true },
 * ];
 */
export const notRevalidatingRoutes: IRouteRule[] = [];
