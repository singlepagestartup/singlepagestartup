import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import { KV_PROVIDER, KV_TTL } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";

export type IMiddlewareGeneric = {
  Variables: undefined;
};

export class Middleware {
  storeProvider: typeof KV_PROVIDER;

  constructor() {
    this.storeProvider = KV_PROVIDER;
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

      if (
        path.includes("rbac/subjects/me") ||
        path.includes("rbac/subjects/init") ||
        path.includes("rbac/subjects/is-authorized") ||
        path.includes("api/telegram")
      ) {
        return await next();
      }

      if (method === "GET" && cacheControl !== "no-cache") {
        const cachedValue = await new StoreProvider({
          type: this.storeProvider,
          prefix: path,
        }).get({
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
        if (method === "GET" && cacheControl !== "no-cache") {
          const resJson = await c.res.clone().json();

          await new StoreProvider({
            type: this.storeProvider,
            prefix: path,
          }).set({
            key: params,
            value: JSON.stringify(resJson),
            options: { ttl: KV_TTL },
          });
        }

        if (["PUT", "PATCH"].includes(method)) {
          await new StoreProvider({
            type: this.storeProvider,
            prefix: path,
          }).delByPrefix();
        }

        if (["POST", "DELETE"].includes(method)) {
          const pathWithoutId = path.replace(
            /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?*/,
            "",
          );

          await new StoreProvider({
            type: this.storeProvider,
            prefix: pathWithoutId,
          }).delByPrefix();
        }
      } else {
        await new StoreProvider({
          type: this.storeProvider,
          prefix: path,
        }).delByPrefix();

        const pathWithoutId = path.replace(
          /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?*/,
          "",
        );

        await new StoreProvider({
          type: this.storeProvider,
          prefix: pathWithoutId,
        }).delByPrefix();
      }

      return;
    });
  }

  setRoutes(app: any) {
    app.get("/http-cache/clear", async (c) => {
      await new StoreProvider({
        type: KV_PROVIDER,
      }).flushall();

      return c.json({ message: "Cache cleared" });
    });
  }
}
