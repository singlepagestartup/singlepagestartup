import { IRouteRule } from "@sps/shared-utils";

/**
 * Project-level cache-excluded routes (startup layer).
 *
 * Projects built on the framework register their own exclusions here — reads
 * that cannot be described by any mutation path or canonical topic (custom
 * aggregates, reports, counters).
 *
 * UPGRADE SAFETY (issue #195): the PRIMARY, upgrade-safe extension seam is the
 * constructor-options path — `new HTTPCacheMiddleware({ excludedRoutes })` in
 * `apps/api/app.ts`. Prefer it: it survives base-module syncs untouched. This
 * `startup.ts` file is ALSO project-owned and preserved across syncs (the
 * framework only ships `singlepage.ts`), so editing it is safe too — just keep
 * a copy of your edits, as a sync will never overwrite it but a fresh scaffold
 * starts it empty.
 *
 * Use a `deny` rule to SUBTRACT a framework default without forking
 * `singlepage.ts` — e.g. re-enable caching of a default-excluded read:
 * export const excludedRoutes: IRouteRule[] = [
 *   { regexPath: /^\/api\/crm\/boards\/[0-9a-f-]+\/burndown$/i },
 *   { regexPath: /some-default-excluded-read/, deny: true },
 * ];
 */
export const excludedRoutes: IRouteRule[] = [];
