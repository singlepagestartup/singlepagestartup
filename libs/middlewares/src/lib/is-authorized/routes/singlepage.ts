import { IRouteRule, UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";

/** Routes whose controllers authenticate the caller and enforce resource access. */
export const controllerGuardedRoutes: IRouteRule[] = [
  {
    regexPath: new RegExp(
      `^/api/rbac/subjects${UUID_PATH_SUFFIX_REGEX.source}`,
    ),
    methods: ["GET"],
  },
];

/**
 * Framework routes that skip the global role check (singlepage layer).
 *
 * Public endpoints accept anonymous requests; controller-guarded routes still
 * enforce their own authentication and ownership checks. Projects add rules
 * in `./startup.ts` or via constructor options.
 */
export const allowedRoutes: IRouteRule[] = [
  ...controllerGuardedRoutes,
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
  /**
   * The read surface of the public modules, one shape per route: find, count
   * and find-by-id on every entity, plus the three page reads the host app
   * calls anonymously. The single unanchored prefix rule these replaced
   * matched every path under those modules, so it would open whatever route a
   * module adds next (issue #276).
   */
  {
    regexPath: /\/api\/(host|website-builder|file-storage)\/[a-z0-9-]+\/?$/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/(host|website-builder|file-storage)\/[a-z0-9-]+\/count$/,
    methods: ["GET"],
  },
  {
    regexPath: new RegExp(
      `/api/(host|website-builder|file-storage)/[a-z0-9-]+${UUID_PATH_SUFFIX_REGEX.source}`,
    ),
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/host\/pages\/(find-by-url|urls|url-segment-value)$/,
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
