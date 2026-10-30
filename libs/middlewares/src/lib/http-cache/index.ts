import type { Hono, Env } from "hono";
import type { createConsistencyRuntime } from "@sps/shared-backend-api";
import type { IRouteRule } from "@sps/shared-utils";
import { Middleware as OperatorSecretMiddleware } from "../operator-secret";

export interface IMiddlewareOptions {
  runtime: Pick<
    ReturnType<typeof createConsistencyRuntime>,
    "cache" | "clearCache"
  >;
  excludedRoutes?: IRouteRule[];
}

/** HTTP response caching delegates freshness and credential isolation to one runtime. */
export class Middleware {
  constructor(private readonly options: IMiddlewareOptions) {}

  init() {
    return this.options.runtime.cache({
      excludedRoutes: this.options.excludedRoutes,
    });
  }

  registerRoutes<Environment extends Env>(app: Hono<Environment>) {
    app.get(
      "/api/http-cache/clear",
      new OperatorSecretMiddleware().init(),
      async (c) => {
        await this.options.runtime.clearCache();
        return c.json({ message: "Cache cleared" });
      },
    );
  }
}
