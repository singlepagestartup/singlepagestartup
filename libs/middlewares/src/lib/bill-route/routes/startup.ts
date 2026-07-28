import { IRouteRule } from "@sps/shared-utils";

/**
 * Project-level routes that require billing (startup layer).
 *
 * Projects built on the framework register their own billed routes here.
 *
 * UPGRADE SAFETY (issue #195): the PRIMARY, upgrade-safe extension seam is the
 * constructor-options path — `new BillRouteMiddleware({ billingRoutes })` in
 * `apps/api/app.ts`. Prefer it: it survives base-module syncs untouched. This
 * `startup.ts` file is ALSO project-owned and preserved across syncs (the
 * framework only ships `singlepage.ts`), so editing it is safe too.
 *
 * Use a `deny` rule to SUBTRACT a framework default without forking
 * `singlepage.ts`:
 * export const billingRoutes: IRouteRule[] = [
 *   { regexPath: /\/api\/crm\/.*\/ai-enrich\/, methods: ["POST"] },
 *   { regexPath: /some-default-billed-route/, deny: true },
 * ];
 */
export const billingRoutes: IRouteRule[] = [];
