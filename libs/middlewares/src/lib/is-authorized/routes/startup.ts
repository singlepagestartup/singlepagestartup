import { IRouteRule } from "@sps/shared-utils";

/**
 * Project-level routes allowed without authentication (startup layer).
 *
 * Projects built on the framework register their own public routes here.
 *
 * UPGRADE SAFETY (issue #195): the PRIMARY, upgrade-safe extension seam is the
 * constructor-options path — `new IsAuthorizedMiddleware({ allowedRoutes })`
 * in `apps/api/app.ts`. Prefer it: it survives base-module syncs untouched.
 * This `startup.ts` file is ALSO project-owned and preserved across syncs (the
 * framework only ships `singlepage.ts`), so editing it is safe too.
 *
 * Use a `deny` rule to SUBTRACT a framework default without forking
 * `singlepage.ts` — e.g. lock down a route the defaults left public:
 * export const allowedRoutes: IRouteRule[] = [
 *   { regexPath: /\/api\/crm\/public-webhooks\/.*\/, methods: ["POST"] },
 *   { regexPath: /some-default-public-route/, deny: true },
 * ];
 */
export const allowedRoutes: IRouteRule[] = [];
