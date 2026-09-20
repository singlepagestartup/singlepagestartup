import { IRouteRule, UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";

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
  /**
   * The read surface of the public modules, one shape per route: find, count
   * and find-by-id on every entity, plus the three page reads the host app
   * calls anonymously. The single unanchored prefix rule these replaced also
   * opened /dump on all 30 of their entities, and would open whatever route a
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
    regexPath: /\/api\/aws-ses/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/http-cache\/clear/,
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
