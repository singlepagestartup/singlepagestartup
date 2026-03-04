import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import { KV_PROVIDER, KV_TTL, UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { logger } from "@sps/backend-utils";

const CACHE_DATA_PREFIX = "http-cache:data";
const CACHE_VERSION_PREFIX = "http-cache:version";
const DEFAULT_CACHE_VERSION = 0;

export type IMiddlewareGeneric = {
  Variables: undefined;
};

export class Middleware {
  storeProvider: StoreProvider;

  constructor() {
    this.storeProvider = new StoreProvider({ type: KV_PROVIDER });
  }

  private getVersionedDataPrefix(path: string, version: number): string {
    return `${CACHE_DATA_PREFIX}:${path}:v${version}`;
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

  private async bumpCacheVersion(path: string): Promise<void> {
    if (!path) {
      return;
    }

    await this.storeProvider.incr({
      prefix: CACHE_VERSION_PREFIX,
      key: path,
    });
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const params = c.req.url.split("?")?.[1] || "";
      const path = c.req.url.split("?")?.[0];

      const method = c.req.method;
      const cacheControl = c.req.header("Cache-Control");

      if (path.includes("revalidation")) {
        return await next();
      }

      if (path.includes("http-cache")) {
        return await next();
      }

      if (path.includes("broadcast")) {
        return await next();
      }

      if (path.includes("favicon.ico")) {
        return await next();
      }

      if (
        path.includes("rbac/subjects/authentication/me") ||
        path.includes("rbac/subjects/authentication/init") ||
        path.includes("rbac/subjects/authentication/is-authorized")
      ) {
        return await next();
      }

      let cacheVersion = DEFAULT_CACHE_VERSION;

      if (method === "GET" && cacheControl !== "no-store") {
        cacheVersion = await this.getCacheVersion(path);
        const versionedDataPrefix = this.getVersionedDataPrefix(
          path,
          cacheVersion,
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

      void (async () => {
        try {
          if (c.res.status >= 200 && c.res.status < 300) {
            if (method === "GET" && cacheControl !== "no-store") {
              const resJson = await c.res.clone().json();
              const versionedDataPrefix = this.getVersionedDataPrefix(
                path,
                cacheVersion,
              );

              await this.storeProvider.set({
                prefix: versionedDataPrefix,
                key: params,
                value: JSON.stringify(resJson),
                options: { ttl: KV_TTL },
              });
            }

            if (["PUT", "PATCH"].includes(method)) {
              const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");
              const prefixesToBump = new Set<string>([
                "/rbac/permissions",
                path,
                pathWithoutId,
              ]);

              if (pathWithoutId.includes("bulk")) {
                const pathWithoutBulk = pathWithoutId.replace(/\/bulk/, "");
                prefixesToBump.add(pathWithoutBulk);
              }

              await Promise.all(
                [...prefixesToBump].map(async (prefix) =>
                  this.bumpCacheVersion(prefix),
                ),
              );
            }

            if (["POST", "DELETE"].includes(method)) {
              const pathWithIdBase = path.match(
                /(.*\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/,
              )?.[1];
              const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");
              const prefixesToBump = new Set<string>([
                "/rbac/permissions",
                pathWithoutId,
              ]);

              if (pathWithIdBase) {
                prefixesToBump.add(pathWithIdBase);
              }

              if (pathWithoutId.includes("bulk")) {
                const pathWithoutBulk = pathWithoutId.replace(/\/bulk/, "");
                prefixesToBump.add(pathWithoutBulk);
              }

              await Promise.all(
                [...prefixesToBump].map(async (prefix) =>
                  this.bumpCacheVersion(prefix),
                ),
              );
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
