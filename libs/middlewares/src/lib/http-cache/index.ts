import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import { KV_PROVIDER, KV_TTL, UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";

export type IMiddlewareGeneric = {
  Variables: undefined;
};

export class Middleware {
  storeProvider: StoreProvider;

  constructor() {
    this.storeProvider = new StoreProvider({ type: KV_PROVIDER });
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

      if (method === "GET" && cacheControl !== "no-store") {
        const cachedValue = await this.storeProvider.get({
          prefix: path,
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

      if (c.res.status >= 200 && c.res.status < 300) {
        if (method === "GET" && cacheControl !== "no-store") {
          const resJson = await c.res.clone().json();

          await this.storeProvider.set({
            prefix: path,
            key: params,
            value: JSON.stringify(resJson),
            options: { ttl: KV_TTL },
          });
        }

        if (["PUT", "PATCH"].includes(method)) {
          await this.storeProvider.delByPrefix({
            prefix: "/rbac/actions",
          });

          await this.storeProvider.delByPrefix({
            prefix: path,
          });

          const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");

          await this.storeProvider.delByPrefix({
            prefix: pathWithoutId,
          });

          if (pathWithoutId.includes("bulk")) {
            const pathWithoutBluk = pathWithoutId.replace(/\/bulk/, "");

            await this.storeProvider.delByPrefix({
              prefix: pathWithoutBluk,
            });
          }
        }

        if (["POST", "DELETE"].includes(method)) {
          await this.storeProvider.delByPrefix({
            prefix: "/rbac/actions",
          });

          const pathWithIdBase = path.match(
            /(.*\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/,
          )?.[1];

          if (pathWithIdBase) {
            await this.storeProvider.delByPrefix({
              prefix: `${pathWithIdBase}`,
            });
          }

          const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");

          await this.storeProvider.delByPrefix({
            prefix: pathWithoutId,
          });

          if (pathWithoutId.includes("bulk")) {
            const pathWithoutBluk = pathWithoutId.replace(/\/bulk/, "");

            await this.storeProvider.delByPrefix({
              prefix: pathWithoutBluk,
            });
          }
        }
      } else {
        if (path.includes("rbac/actions")) {
          return;
        }

        if (c.res.status >= 500) {
          await this.storeProvider.delByPrefix({
            prefix: path,
          });
          const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");
          await this.storeProvider.delByPrefix({
            prefix: pathWithoutId,
          });
        }
      }

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
