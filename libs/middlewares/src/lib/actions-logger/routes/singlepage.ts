import { IRouteRule } from "@sps/shared-utils";

/**
 * Framework-default routes whose successful mutations are logged as RBAC
 * actions (singlepage layer). Only requests matching a rule (path + method)
 * are logged. Projects extend in `./startup.ts` or via constructor options.
 */
export const loggingRoutes: IRouteRule[] = [
  {
    regexPath:
      /\/api\/rbac\/subjects\/[a-zA-Z0-9-]+\/social-module\/profiles\/[a-zA-Z0-9-]+\/chats\/[a-zA-Z0-9-]+\/actions/,
    methods: ["POST", "PATCH", "DELETE"],
  },
  {
    regexPath:
      /\/api\/rbac\/subjects\/[a-zA-Z0-9-]+\/social-module\/profiles\/[a-zA-Z0-9-]+\/chats\/[a-zA-Z0-9-]+\/messages/,
    methods: ["POST"],
  },
  {
    regexPath:
      /\/api\/rbac\/subjects\/[a-zA-Z0-9-]+\/social-module\/profiles\/[a-zA-Z0-9-]+\/chats\/[a-zA-Z0-9-]+\/threads\/[a-zA-Z0-9-]+\/messages/,
    methods: ["POST"],
  },
];
