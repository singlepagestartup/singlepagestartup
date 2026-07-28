import { IRouteRule } from "@sps/shared-utils";

/**
 * Framework-default routes allowed WITHOUT authentication (singlepage layer).
 *
 * A request matching any of these (path + method) skips the is-authorized
 * check. Projects add their own in `./startup.ts` or via constructor options.
 */
export const allowedRoutes: IRouteRule[] = [
  {
    regexPath: /\/favicon.ico/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/broadcast\/channels/,
    methods: ["GET"],
  },
  {
    regexPath:
      /\/api\/rbac\/subjects\/authentication\/(is-authorized|me|init|refresh|bill-route)/,
    methods: ["GET", "POST"],
  },
  {
    regexPath: /\/api\/rbac\/subjects\/authentication\/oauth\/.*/,
    methods: ["GET", "POST"],
  },
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication)\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/roles-to-permissions/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/subjects-to-roles/,
    methods: ["GET"],
  },
  {
    regexPath: /\/public\/file-storage\/.*/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/(host|website-builder|file-storage)\/.*/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/aws-ses/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/http-cache\/clear/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/revalidation\/revalidate/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/permissions$/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/permissions\/.*/,
    methods: ["GET"],
  },
];
