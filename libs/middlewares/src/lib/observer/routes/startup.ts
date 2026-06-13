import { IRouteRule } from "@sps/shared-utils";

/**
 * Project-level routes the observer pipeline skips (startup layer).
 *
 * Projects built on the framework register routes that must not trigger
 * observer pipelines here.
 *
 * UPGRADE SAFETY (issue #195): the PRIMARY, upgrade-safe extension seam is the
 * constructor-options path — `new ObserverMiddleware({ skippedRoutes })` in
 * `apps/api/app.ts`. Prefer it: it survives base-module syncs untouched. This
 * `startup.ts` file is ALSO project-owned and preserved across syncs (the
 * framework only ships `singlepage.ts`), so editing it is safe too.
 *
 * Use a `deny` rule to SUBTRACT a framework default without forking
 * `singlepage.ts`:
 * export const skippedRoutes: IRouteRule[] = [
 *   { regexPath: /\/api\/crm\/internal\/.*\/ },
 *   { regexPath: /some-default-skipped-route/, deny: true },
 * ];
 */
export const skippedRoutes: IRouteRule[] = [];
