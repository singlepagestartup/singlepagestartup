import { IRouteRule } from "@sps/shared-utils";

/**
 * Framework-default cache-excluded routes (singlepage layer).
 *
 * Any request whose path matches one of these rules bypasses the HTTP cache
 * entirely (read straight through, never stored). Two kinds live here:
 *
 * 1. Infrastructure / non-model endpoints that must never be cached
 *    (revalidation, http-cache control, broadcast, favicon, auth probes).
 * 2. Reads that no mutation path or canonical topic can describe — custom
 *    aggregates and realtime-critical scopes (issue-152 cart counters,
 *    issue-195 chat reads) kept as defense-in-depth on top of topic versioning.
 *
 * Projects add their own exclusions in `./startup.ts` or via the middleware
 * constructor options.
 */
export const excludedRoutes: IRouteRule[] = [
  // --- Infrastructure / non-model endpoints (formerly inline substring checks) ---
  { regexPath: /revalidation/ },
  { regexPath: /http-cache/ },
  { regexPath: /broadcast/ },
  { regexPath: /favicon\.ico/ },
  {
    regexPath: /rbac\/subjects\/authentication\/(me|init|is-authorized)/,
  },

  // --- Reads not describable by a mutation path/topic ---
  // Issue-152: subject cart aggregate counters — exact-path cache
  // invalidation may leave stale quantity/total after cart mutations.
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/ecommerce-module\/orders\/(quantity|total)$/i,
  },
  // Issue-195 defense-in-depth: chat thread messages and chat actions reads.
  // Message update/delete mutations hit chat-scoped paths and can never bump
  // the thread-scoped messages GET path; chat actions are created server-side.
  // Topic-versioned caching covers these now — the exclusions remain as the
  // second safety belt for realtime-critical chat reads.
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/social-module\/profiles\/[0-9a-f-]+\/chats\/[0-9a-f-]+\/threads\/[0-9a-f-]+\/messages$/i,
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/social-module\/profiles\/[0-9a-f-]+\/chats\/[0-9a-f-]+\/actions$/i,
  },
];
