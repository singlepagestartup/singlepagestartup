import {
  createLayeredRouteMatcher,
  IRouteRule,
  RouteMatcher,
} from "@sps/shared-utils";
import { allowedRoutes as singlepageAllowedRoutes } from "./singlepage";
import { allowedRoutes as startupAllowedRoutes } from "./startup";

export type { IRouteRule };
export { allowedRoutes as singlepageAllowedRoutes } from "./singlepage";
export { allowedRoutes as startupAllowedRoutes } from "./startup";

/**
 * Builds the "allowed without auth" matcher from the three layers:
 * constructor options → project startup → framework singlepage defaults.
 * Delegates to the shared `createLayeredRouteMatcher` (issue #195 cleanup).
 */
export function createAllowedRoutesMatcher(
  optionRoutes: IRouteRule[] = [],
): RouteMatcher {
  return createLayeredRouteMatcher(
    optionRoutes,
    startupAllowedRoutes,
    singlepageAllowedRoutes,
  );
}
