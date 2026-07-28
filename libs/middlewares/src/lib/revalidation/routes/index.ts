import {
  createLayeredRouteMatcher,
  IRouteRule,
  RouteMatcher,
} from "@sps/shared-utils";
import { notRevalidatingRoutes as singlepageNotRevalidatingRoutes } from "./singlepage";
import { notRevalidatingRoutes as startupNotRevalidatingRoutes } from "./startup";

export type { IRouteRule };
export { notRevalidatingRoutes as singlepageNotRevalidatingRoutes } from "./singlepage";
export { notRevalidatingRoutes as startupNotRevalidatingRoutes } from "./startup";

/**
 * Builds the "skip revalidation broadcast" matcher from the three layers:
 * constructor options → project startup → framework singlepage defaults.
 * Delegates to the shared `createLayeredRouteMatcher` (issue #195 cleanup).
 */
export function createNotRevalidatingRoutesMatcher(
  optionRoutes: IRouteRule[] = [],
): RouteMatcher {
  return createLayeredRouteMatcher(
    optionRoutes,
    startupNotRevalidatingRoutes,
    singlepageNotRevalidatingRoutes,
  );
}
