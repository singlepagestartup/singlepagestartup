import { IRouteRule } from "@sps/shared-utils";

/**
 * Framework-default routes the observer pipeline SKIPS (singlepage layer).
 *
 * A request matching any rule does not trigger observer broadcast pipelines —
 * broadcast endpoints are excluded to avoid recursive observation. Projects
 * extend in `./startup.ts` or via constructor options.
 */
export const skippedRoutes: IRouteRule[] = [
  {
    regexPath: /\/api\/broadcast/,
  },
];
