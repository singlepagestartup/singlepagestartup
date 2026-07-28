import { IRouteRule } from "@sps/shared-utils";

/**
 * Framework-default routes that do NOT trigger a revalidation broadcast
 * (singlepage layer). A request matching any rule (path + method) is skipped —
 * authentication and internal action/broadcast writes should not fan out as
 * realtime invalidations. Projects extend in `./startup.ts` or via
 * constructor options.
 */
export const notRevalidatingRoutes: IRouteRule[] = [
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication)\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/broadcast\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/actions/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/actions\/(\w+)?/,
    methods: ["POST"],
  },
];
