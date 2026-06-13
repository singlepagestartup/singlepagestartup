import { IRouteRule } from "@sps/shared-utils";

/**
 * Project-level routes whose mutations are logged (startup layer).
 *
 * Projects built on the framework register their own logged routes here.
 *
 * UPGRADE SAFETY (issue #195): the PRIMARY, upgrade-safe extension seam is the
 * constructor-options path — `new ActionsLoggerMiddleware({ loggingRoutes })`
 * in `apps/api/app.ts`. Prefer it: it survives base-module syncs untouched.
 * This `startup.ts` file is ALSO project-owned and preserved across syncs (the
 * framework only ships `singlepage.ts`), so editing it is safe too.
 *
 * Use a `deny` rule to SUBTRACT a framework default without forking
 * `singlepage.ts`:
 * export const loggingRoutes: IRouteRule[] = [
 *   { regexPath: /\/api\/crm\/boards\/[a-zA-Z0-9-]+\/cards\/, methods: ["POST"] },
 *   { regexPath: /some-default-logged-route/, deny: true },
 * ];
 */
export const loggingRoutes: IRouteRule[] = [];
