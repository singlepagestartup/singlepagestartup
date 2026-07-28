import {
  createLayeredRouteMatcher,
  IRouteRule,
  RouteMatcher,
} from "@sps/shared-utils";
import { excludedRoutes as singlepageExcludedRoutes } from "./singlepage";
import { excludedRoutes as startupExcludedRoutes } from "./startup";

export type { IRouteRule };
export { excludedRoutes as singlepageExcludedRoutes } from "./singlepage";
export { excludedRoutes as startupExcludedRoutes } from "./startup";

/**
 * Builds the cache-exclusion matcher from the three layers: programmatic
 * options (highest intent) → project startup defaults → framework singlepage
 * defaults. A request matching any layer bypasses the HTTP cache. Delegates to
 * the shared `createLayeredRouteMatcher` (issue #195 cleanup).
 */
export function createExcludedRoutesMatcher(
  optionRoutes: IRouteRule[] = [],
): RouteMatcher {
  return createLayeredRouteMatcher(
    optionRoutes,
    startupExcludedRoutes,
    singlepageExcludedRoutes,
  );
}
