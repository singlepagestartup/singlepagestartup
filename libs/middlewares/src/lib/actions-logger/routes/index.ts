import {
  createLayeredRouteMatcher,
  IRouteRule,
  RouteMatcher,
} from "@sps/shared-utils";
import { loggingRoutes as singlepageLoggingRoutes } from "./singlepage";
import { loggingRoutes as startupLoggingRoutes } from "./startup";

export type { IRouteRule };
export { loggingRoutes as singlepageLoggingRoutes } from "./singlepage";
export { loggingRoutes as startupLoggingRoutes } from "./startup";

/**
 * Builds the "log this mutation" matcher from the three layers:
 * constructor options → project startup → framework singlepage defaults.
 * Delegates to the shared `createLayeredRouteMatcher` (issue #195 cleanup).
 */
export function createLoggingRoutesMatcher(
  optionRoutes: IRouteRule[] = [],
): RouteMatcher {
  return createLayeredRouteMatcher(
    optionRoutes,
    startupLoggingRoutes,
    singlepageLoggingRoutes,
  );
}
