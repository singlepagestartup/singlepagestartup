import {
  createLayeredRouteMatcher,
  IRouteRule,
  RouteMatcher,
} from "@sps/shared-utils";
import { billingRoutes as singlepageBillingRoutes } from "./singlepage";
import { billingRoutes as startupBillingRoutes } from "./startup";

export type { IRouteRule };
export { billingRoutes as singlepageBillingRoutes } from "./singlepage";
export { billingRoutes as startupBillingRoutes } from "./startup";

/**
 * Builds the "bill this route" matcher from the three layers:
 * constructor options → project startup → framework singlepage defaults.
 * Delegates to the shared `createLayeredRouteMatcher` (issue #195 cleanup).
 */
export function createBillingRoutesMatcher(
  optionRoutes: IRouteRule[] = [],
): RouteMatcher {
  return createLayeredRouteMatcher(
    optionRoutes,
    startupBillingRoutes,
    singlepageBillingRoutes,
  );
}
