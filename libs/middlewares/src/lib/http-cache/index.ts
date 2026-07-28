import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  defaultCompiledTopicRules,
  IRouteRule,
  KV_PROVIDER,
  KV_TTL,
  resolveTopicsForPath,
  RouteMatcher,
  UUID_PATH_PREFIX_REGEX,
  UUID_PATH_SUFFIX_REGEX,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createExcludedRoutesMatcher } from "./routes";
import { logger } from "@sps/backend-utils";

const CACHE_DATA_PREFIX = "http-cache:data";
const CACHE_VERSION_PREFIX = "http-cache:version";
const DEFAULT_CACHE_VERSION = 0;

export type IMiddlewareGeneric = {
  Variables: undefined;
};

/**
 * Project extension seam (issue #195): framework consumers add their own
 * cache-excluded paths (e.g. aggregate counters whose read path cannot be
 * derived from any mutation path) without forking the middleware.
 *
 * - `excludedRoutes`: route rules merged with the framework defaults
 *   (`routes/singlepage.ts`) and the project layer (`routes/startup.ts`).
 * - `excludedPathPatterns`: legacy plain-regex form, still accepted and
 *   normalized into method-less route rules.
 */
export interface IMiddlewareOptions {
  excludedRoutes?: IRouteRule[];
  excludedPathPatterns?: RegExp[];
}

export function getTopicVersionKey(topic: string): string {
  return `topic:${topic}`;
}

/**
 * Builds the versioned cache-data prefix for a GET path (issue #195
 * topic-versioned caching). The key embeds BOTH the legacy per-path version
 * and a vector of per-topic versions derived from the read path. Any mutation
 * that bumps either the path version OR one of the topic versions rotates the
 * key, so nested read scopes (e.g. thread messages) are invalidated by
 * mutations whose paths could never derive the read path. Topics are sorted
 * for determinism.
 */
export function buildVersionedDataPrefix(
  path: string,
  pathVersion: number,
  topicVersionsByTopic: Record<string, number>,
): string {
  const topicVector = Object.keys(topicVersionsByTopic)
    .sort()
    .map((topic) => topicVersionsByTopic[topic] || 0)
    .join(".");

  return `${CACHE_DATA_PREFIX}:${path}:v${pathVersion}:t${topicVector || "0"}`;
}

export class Middleware {
  storeProvider: StoreProvider;
  private excludedRoutesMatcher: RouteMatcher;

  constructor(options?: IMiddlewareOptions) {
    this.storeProvider = new StoreProvider({ type: KV_PROVIDER });
    // Three exclusion layers composed through the shared RouteMatcher:
    // constructor options → project startup (routes/startup.ts) → framework
    // defaults (routes/singlepage.ts). Legacy `excludedPathPatterns` regexes
    // are normalized into method-less rules.
    const optionRoutes: IRouteRule[] = [
      ...(options?.excludedRoutes || []),
      ...(options?.excludedPathPatterns || []).map((regexPath) => ({
        regexPath,
      })),
    ];
    this.excludedRoutesMatcher = createExcludedRoutesMatcher(optionRoutes);
  }

  private async getCacheVersion(path: string): Promise<number> {
    const rawVersion = await this.storeProvider.get({
      prefix: CACHE_VERSION_PREFIX,
      key: path,
    });

    if (!rawVersion) {
      return DEFAULT_CACHE_VERSION;
    }

    const version = Number(rawVersion);

    if (!Number.isFinite(version) || version < DEFAULT_CACHE_VERSION) {
      return DEFAULT_CACHE_VERSION;
    }

    return version;
  }

  private async getTopicVersions(
    topics: string[],
  ): Promise<Record<string, number>> {
    const entries = await Promise.all(
      topics.map(async (topic) => {
        const version = await this.getCacheVersion(getTopicVersionKey(topic));

        return [topic, version] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  private async bumpCacheVersion(path: string): Promise<void> {
    if (!path) {
      return;
    }

    await this.storeProvider.incr({
      prefix: CACHE_VERSION_PREFIX,
      key: path,
    });
  }

  private async bumpTopicVersions(path: string): Promise<void> {
    // Shared resolver (issue #195 F2): the SAME rule-vs-canonical resolution
    // the revalidation middleware uses to broadcast. If a project topic rule
    // remaps a mutation's topics, the cache bump and the WS broadcast stay in
    // lockstep — otherwise cached reads would be served stale despite the
    // broadcast announcing a change.
    const topics = resolveTopicsForPath(path, defaultCompiledTopicRules);

    await Promise.all(
      topics.map(async (topic) =>
        this.bumpCacheVersion(getTopicVersionKey(topic)),
      ),
    );
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const params = c.req.url.split("?")?.[1] || "";
      const path = c.req.url.split("?")?.[0];
      let pathname = c.req.path;
      try {
        pathname = new URL(c.req.url).pathname;
      } catch {
        pathname = c.req.path;
      }

      const method = c.req.method;
      const cacheControl = c.req.header("Cache-Control");

      // Exclusion gate (issue #195 F1): exclusions (routes/singlepage.ts +
      // routes/startup.ts + options) bypass only the GET response CACHE — the
      // read lookup and the write below. They must NOT bypass the mutation
      // version-bump: the chat `/messages$` and `/actions$` exclusion regexes
      // also match the CREATE POST on those paths, and previously the blanket
      // early-return skipped the bump for create-only while update/delete on
      // `/messages/{id}` still bumped — an inconsistent create-only staleness
      // gap. Mutations now always run the bump block, excluded or not.
      const isCacheExcluded = this.excludedRoutesMatcher.matches(pathname);
      const isCacheableGet =
        method === "GET" && cacheControl !== "no-store" && !isCacheExcluded;

      let cacheVersion = DEFAULT_CACHE_VERSION;
      let topicVersionsByTopic: Record<string, number> = {};

      if (isCacheableGet) {
        // Topic-versioned caching (issue #195): the key embeds per-topic
        // versions resolved from the read path through the SAME resolver the
        // mutation bump uses, so any mutation touching the same topics rotates
        // the key — even when the mutation path cannot derive this read path
        // (nested scopes), and even when a project topic rule remaps topics.
        const readTopics = resolveTopicsForPath(
          pathname,
          defaultCompiledTopicRules,
        );
        [cacheVersion, topicVersionsByTopic] = await Promise.all([
          this.getCacheVersion(path),
          this.getTopicVersions(readTopics),
        ]);
        const versionedDataPrefix = buildVersionedDataPrefix(
          path,
          cacheVersion,
          topicVersionsByTopic,
        );

        const cachedValue = await this.storeProvider.get({
          prefix: versionedDataPrefix,
          key: params,
        });

        if (cachedValue) {
          const response = new Response(cachedValue, {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          });

          return response;
        }
      }

      await next();

      // Issue-195 ordering contract: cache-version bumps for successful
      // mutations are AWAITED before this middleware completes, so the outer
      // RevalidationMiddleware WS broadcast (which unwinds after this block)
      // can never outrun cache invalidation. See apps/api/app.ts registration
      // order. GET response-caching writes stay fire-and-forget below.
      if (
        c.res.status >= 200 &&
        c.res.status < 300 &&
        ["PUT", "PATCH", "POST", "DELETE"].includes(method)
      ) {
        try {
          const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");
          const prefixesToBump = new Set<string>([
            "/rbac/permissions",
            pathWithoutId,
          ]);

          if (["PUT", "PATCH"].includes(method)) {
            prefixesToBump.add(path);
          }

          if (["POST", "DELETE"].includes(method)) {
            // Path up to and including the first UUID (issue #195 F5b: shared
            // UUID shape, no inline literal).
            const pathWithIdBase = path.match(UUID_PATH_PREFIX_REGEX)?.[1];

            if (pathWithIdBase) {
              prefixesToBump.add(pathWithIdBase);
            }
          }

          if (pathWithoutId.includes("bulk")) {
            const pathWithoutBulk = pathWithoutId.replace(/\/bulk/, "");
            prefixesToBump.add(pathWithoutBulk);
          }

          await Promise.all([
            ...[...prefixesToBump].map(async (prefix) =>
              this.bumpCacheVersion(prefix),
            ),
            // Topic versions (issue #195): invalidate every cached read whose
            // canonical topics include this mutation's topics, regardless of
            // path shape. Awaited for the same bump-before-broadcast contract.
            this.bumpTopicVersions(pathname),
          ]);
        } catch (error) {
          logger.error(error);
        }
      }

      void (async () => {
        try {
          if (c.res.status >= 200 && c.res.status < 300) {
            // Mirror the read gate (issue #195 F1): excluded GETs are read
            // straight through and never written back to the cache.
            if (isCacheableGet) {
              const resJson = await c.res.clone().json();
              const versionedDataPrefix = buildVersionedDataPrefix(
                path,
                cacheVersion,
                topicVersionsByTopic,
              );

              await this.storeProvider.set({
                prefix: versionedDataPrefix,
                key: params,
                value: JSON.stringify(resJson),
                options: { ttl: KV_TTL },
              });
            }
          } else {
            if (path.includes("rbac/permissions")) {
              return;
            }

            if (c.res.status >= 500) {
              const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");

              await Promise.all([
                this.bumpCacheVersion(path),
                this.bumpCacheVersion(pathWithoutId),
              ]);
            }
          }
        } catch (error) {
          logger.error(error);
        }
      })();

      return;
    });
  }

  setRoutes(app: any) {
    app.get("/api/http-cache/clear", async (c) => {
      await new StoreProvider({
        type: KV_PROVIDER,
      }).flushall();

      return c.json({ message: "Cache cleared" });
    });
  }
}
