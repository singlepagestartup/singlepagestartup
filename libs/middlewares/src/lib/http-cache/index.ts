import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  defaultCompiledTopicRules,
  HTTP_CACHE_MAX_ENTRY_BYTES,
  IRouteRule,
  KV_PROVIDER,
  KV_TTL,
  resolveTopicsForPath,
  RouteMatcher,
  UUID_PATH_PREFIX_REGEX,
  UUID_PATH_SUFFIX_REGEX,
} from "@sps/shared-utils";
import { Context, MiddlewareHandler } from "hono";
import { createExcludedRoutesMatcher } from "./routes";
import { createCacheGuard, ICacheGuard } from "./guard";
import { Middleware as OperatorSecretMiddleware } from "../operator-secret";
import { authorization, logger, readRbacSecret } from "@sps/backend-utils";

/**
 * Namespace of stored bodies. `v2` starts with the credential gate (issue
 * #306): bodies written before it, under `http-cache:data:<url>`, may have
 * been produced for a credentialed caller, so this release never looks them up
 * and they expire on their TTL.
 */
const CACHE_DATA_PREFIX = "http-cache:data:v2";
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
  guard: ICacheGuard;
  private excludedRoutesMatcher: RouteMatcher;

  constructor(options?: IMiddlewareOptions) {
    this.storeProvider = new StoreProvider({ type: KV_PROVIDER });
    // Every KV call on the request path goes through this guard (issue #233):
    // a cache that cannot answer within its deadline yields a miss or a
    // skipped write, never a stalled or failed request.
    this.guard = createCacheGuard();
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

  /**
   * Reads one version counter. Returns `null` when the KV store could not
   * answer (issue #233): a missing key legitimately means generation 0, but an
   * unreachable store must NOT be read as generation 0 — that would let a
   * degraded read serve a body from a generation the caller is not on. `null`
   * makes the caller skip the cache for this request instead.
   */
  private async getCacheVersion(path: string): Promise<number | null> {
    const rawVersion = await this.guard.run<string | null | undefined>({
      name: `version read ${path}`,
      fallback: undefined,
      execute: async () =>
        this.storeProvider.get({
          prefix: CACHE_VERSION_PREFIX,
          key: path,
        }),
    });

    if (rawVersion === undefined) {
      return null;
    }

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
  ): Promise<Record<string, number> | null> {
    const entries = await Promise.all(
      topics.map(async (topic) => {
        const version = await this.getCacheVersion(getTopicVersionKey(topic));

        return [topic, version] as const;
      }),
    );

    // One unreadable topic version is enough to make the whole vector
    // untrustworthy; skip the cache rather than build a key from a guess.
    if (entries.some(([, version]) => version === null)) {
      return null;
    }

    return Object.fromEntries(entries) as Record<string, number>;
  }

  private async bumpCacheVersion(path: string): Promise<void> {
    if (!path) {
      return;
    }

    await this.guard.run<void>({
      name: `version bump ${path}`,
      fallback: undefined,
      execute: async () => {
        // Issue #233: version counters carry the same expiry as the data keys
        // they address, refreshed on every bump. An idle path's counters and
        // its cached bodies then expire together, and the counter can only
        // reset to 0 after every body from an earlier generation is gone.
        await this.storeProvider.incr({
          prefix: CACHE_VERSION_PREFIX,
          key: path,
          options: { ttl: KV_TTL },
        });
      },
    });
  }

  /**
   * Reads a cached body. A failure is indistinguishable from a miss for the
   * caller, which is the point: the handler runs either way.
   */
  private async readCachedResponse(props: {
    prefix: string;
    key: string;
  }): Promise<string | null> {
    return this.guard.run<string | null>({
      name: `response read ${props.prefix}`,
      fallback: null,
      execute: async () =>
        this.storeProvider.get({ prefix: props.prefix, key: props.key }),
    });
  }

  /**
   * Stores a cached body unless it exceeds the admission cap. The production
   * incident multiplied ~2.5 MiB collection responses across generations and
   * query variants; refusing the largest bodies removes most of the retained
   * bytes and costs only a later miss.
   */
  private async writeCachedResponse(props: {
    prefix: string;
    key: string;
    value: string;
  }): Promise<void> {
    const bytes = Buffer.byteLength(props.value, "utf8");

    if (bytes > HTTP_CACHE_MAX_ENTRY_BYTES) {
      logger.debug(
        `HTTP cache entry not stored, ${bytes} bytes exceeds HTTP_CACHE_MAX_ENTRY_BYTES=${HTTP_CACHE_MAX_ENTRY_BYTES}: ${props.prefix}`,
      );

      return;
    }

    await this.guard.run<void>({
      name: `response write ${props.prefix}`,
      fallback: undefined,
      execute: async () => {
        await this.storeProvider.set({
          prefix: props.prefix,
          key: props.key,
          value: props.value,
          options: { ttl: KV_TTL },
        });
      },
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

  /**
   * Whether the request presents a credential (issue #306): a subject token in
   * the `Authorization` header or the `rbac.subject.jwt` cookie, or the operator
   * secret in the `X-RBAC-SECRET-KEY` header or the `rbac.secret-key` cookie,
   * read by the same helpers the handlers use.
   *
   * This middleware answers before authorization runs and its key carries no
   * principal. Keeping credentialed requests out of the lookup and the
   * write-back means every stored body was produced for a caller without a
   * credential, whom authorization admitted on that miss, and is only replayed
   * to another such caller. Presence decides, not validity: an expired or
   * forged token still reaches authorization and its refusal.
   */
  private hasCredentials(c: Context): boolean {
    return Boolean(authorization(c) || readRbacSecret(c));
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
      //
      // Credential gate (issue #306): a request that presents a credential is
      // kept away from the stored bodies the same way — no lookup, no
      // write-back — while its mutations still bump, because a credentialed
      // write is what invalidates the anonymous reads it changed.
      const isCacheExcluded = this.excludedRoutesMatcher.matches(pathname);
      const isCacheableGet =
        method === "GET" &&
        cacheControl !== "no-store" &&
        !isCacheExcluded &&
        !this.hasCredentials(c);

      let cacheVersion = DEFAULT_CACHE_VERSION;
      let topicVersionsByTopic: Record<string, number> = {};
      // Set only when the generation vector was actually read (issue #233).
      // It gates the write-back below: a request served while the KV store was
      // unreachable must not be stored under a guessed generation.
      let isCacheAddressable = false;

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
        const [pathVersion, topicVersions] = await Promise.all([
          this.getCacheVersion(path),
          this.getTopicVersions(readTopics),
        ]);

        isCacheAddressable = pathVersion !== null && topicVersions !== null;
        cacheVersion = pathVersion ?? DEFAULT_CACHE_VERSION;
        topicVersionsByTopic = topicVersions ?? {};
      }

      if (isCacheAddressable) {
        const versionedDataPrefix = buildVersionedDataPrefix(
          path,
          cacheVersion,
          topicVersionsByTopic,
        );

        const cachedValue = await this.readCachedResponse({
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
            // Mirror the read gate (issue #195 F1, issue #306): excluded and
            // credentialed GETs are read straight through and never written
            // back to the cache. Issue #233 narrows the same gate —
            // `isCacheAddressable` means a cacheable GET whose generation
            // vector was actually read, and a response produced while the KV
            // store was unreachable has no address.
            if (isCacheAddressable) {
              const resJson = await c.res.clone().json();
              const versionedDataPrefix = buildVersionedDataPrefix(
                path,
                cacheVersion,
                topicVersionsByTopic,
              );

              await this.writeCachedResponse({
                prefix: versionedDataPrefix,
                key: params,
                value: JSON.stringify(resJson),
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
    // Flushing is an operator action, and this route answers before the
    // is-authorized middleware exists (issue #277), so the credential check
    // has to travel with the route rather than sit in the allow-list.
    const operatorSecret = new OperatorSecretMiddleware();

    app.get("/api/http-cache/clear", operatorSecret.init(), async (c) => {
      await Promise.all([
        this.storeProvider.delByPrefix({ prefix: CACHE_DATA_PREFIX }),
        this.storeProvider.delByPrefix({ prefix: CACHE_VERSION_PREFIX }),
      ]);

      return c.json({ message: "Cache cleared" });
    });
  }
}
