import type { IRouteRule } from "@sps/shared-utils";
import {
  controllerGuardedRoutes,
  privateCommerceRoutes,
} from "./sensitive-routes";

export const rbacHttpCacheExcludeRoutes: IRouteRule[] = [
  ...controllerGuardedRoutes,
  ...privateCommerceRoutes,
  {
    regexPath: /^\/api\/file-storage\/files(?:\/.*)?$/i,
    methods: ["GET", "HEAD"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/(?:orders|orders-to-products|catalogue-context)\/?$/i,
    methods: ["GET"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/orders\/(?:[^/]+\/)?(?:quantity|total)\/?$/i,
    methods: ["GET"],
  },
];
