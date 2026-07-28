import {
  createLayeredRouteMatcher,
  IRouteRule,
  RouteMatcher,
} from "@sps/shared-utils";
import { skippedRoutes as singlepageSkippedRoutes } from "./singlepage";
import { skippedRoutes as startupSkippedRoutes } from "./startup";

export type { IRouteRule };
export { skippedRoutes as singlepageSkippedRoutes } from "./singlepage";
export { skippedRoutes as startupSkippedRoutes } from "./startup";

/**
 * Builds the "skip observer pipeline" matcher from the three layers:
 * constructor options → project startup → framework singlepage defaults.
 * Delegates to the shared `createLayeredRouteMatcher` (issue #195 cleanup).
 */
export function createSkippedRoutesMatcher(
  optionRoutes: IRouteRule[] = [],
): RouteMatcher {
  return createLayeredRouteMatcher(
    optionRoutes,
    startupSkippedRoutes,
    singlepageSkippedRoutes,
  );
}
