import { IRouteRule, UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";

/**
 * Framework-default routes allowed WITHOUT authentication (singlepage layer).
 *
 * A request matching any of these (path + method) skips the is-authorized
 * check. Projects add their own in `./startup.ts` or via constructor options.
 *
 * Every rule is anchored at both ends and names the routes it opens: the
 * matcher tests the lowercased path, so a rule without `^` and `$` also opens
 * any sub-route, any sibling whose name starts the same way and any path that
 * embeds the same segments (issue #308). A route that leaves this list is
 * decided by the permission service like every other route.
 */
export const allowedRoutes: IRouteRule[] = [
  {
    regexPath: /^\/favicon\.ico$/,
    methods: ["GET"],
  },
  /**
   * The channel list only. The observer middleware looks up its channel here
   * without a credential after every write; the channel's messages and the
   * channels-to-messages relation stay behind authorization (issue #308).
   */
  {
    regexPath: /^\/api\/broadcast\/channels$/,
    methods: ["GET"],
  },
  /**
   * Every route of the subject authentication controller, grouped by method.
   * Callers reach them without a session, and each handler checks what it
   * needs itself: a token, a password, an OAuth state (issue #308).
   */
  {
    regexPath:
      /^\/api\/rbac\/subjects\/authentication\/(is-authorized|me|init)$/,
    methods: ["GET"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/authentication\/(bill-route|refresh|logout|ethereum-virtual-machine)$/,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/authentication\/email-and-password\/(registration|authentication|forgot-password|reset-password)$/,
    methods: ["POST"],
  },
  /**
   * OAuth start (`oauth/:provider`) and code exchange (`oauth/exchange`) share
   * one shape; the provider's callback is the redirect target. The service
   * refuses a provider it does not support.
   */
  {
    regexPath: /^\/api\/rbac\/subjects\/authentication\/oauth\/[a-z0-9-]+$/,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/authentication\/oauth\/[a-z0-9-]+\/callback$/,
    methods: ["GET"],
  },
  {
    regexPath: /^\/public\/file-storage\/.+$/,
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
    regexPath: /^\/api\/(host|website-builder|file-storage)\/[a-z0-9-]+\/?$/,
    methods: ["GET"],
  },
  {
    regexPath:
      /^\/api\/(host|website-builder|file-storage)\/[a-z0-9-]+\/count$/,
    methods: ["GET"],
  },
  {
    regexPath: new RegExp(
      `^/api/(host|website-builder|file-storage)/[a-z0-9-]+${UUID_PATH_SUFFIX_REGEX.source}`,
    ),
    methods: ["GET"],
  },
  {
    regexPath: /^\/api\/host\/pages\/(find-by-url|urls|url-segment-value)$/,
    methods: ["GET"],
  },
];
