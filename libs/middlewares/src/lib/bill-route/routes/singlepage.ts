import { IRouteRule } from "@sps/shared-utils";

/**
 * Framework-default routes that require billing to be checked (singlepage
 * layer). Only requests matching a rule (path + method) are billed; everything
 * else passes straight through. Projects extend in `./startup.ts` or via
 * constructor options.
 */
export const billingRoutes: IRouteRule[] = [
  {
    regexPath:
      /\/api\/rbac\/subjects\/[a-zA-Z0-9-]+\/social-module\/profiles\/[a-zA-Z0-9-]+\/chats\/[a-zA-Z0-9-]+\/messages\/[a-zA-Z0-9-]+\/react-by\/openrouter/,
    methods: ["POST"],
  },
];
