import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import {
  IRouteRule,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
  RouteMatcher,
  createMemoryCache,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { getCookie } from "hono/cookie";
import { getHttpErrorType } from "@sps/backend-utils";
import { createAllowedRoutesMatcher } from "./routes";

export type IMiddlewareGeneric = unknown;

/**
 * Project extension seam: framework consumers register routes allowed without
 * authentication via constructor options, merged with the framework defaults
 * (`routes/singlepage.ts`) and the project layer (`routes/startup.ts`).
 */
export interface IMiddlewareOptions {
  allowedRoutes?: IRouteRule[];
}

const inFlight = new Map<string, Promise<void>>();
const cache = createMemoryCache({ ttlMs: 30_000, maxSize: 5000 });

export class Middleware {
  private allowedRoutesMatcher: RouteMatcher;

  constructor(options?: IMiddlewareOptions) {
    this.allowedRoutesMatcher = createAllowedRoutesMatcher(
      options?.allowedRoutes,
    );
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const reqMethod = c.req.method.toUpperCase();
      const reqPath = c.req.path.toLowerCase();
      const secretKey =
        c.req.header("X-RBAC-SECRET-KEY") || getCookie(c, "rbac.secret-key");
      const authorization =
        c.req.header("Authorization")?.replace("Bearer ", "") ||
        getCookie(c, "rbac.subject.jwt");

      const origin = c.req.header("Host");
      const allowedOrigins = new Set([
        "http://localhost:3000",
        NEXT_PUBLIC_HOST_SERVICE_URL,
      ]);

      if (origin && allowedOrigins.has(origin)) {
        c.res.headers["Access-Control-Allow-Origin"] = origin;
      }

      if (secretKey && secretKey === RBAC_SECRET_KEY) {
        return next();
      }

      if (this.allowedRoutesMatcher.matches(reqPath, reqMethod)) {
        return next();
      }

      try {
        const headers: HeadersInit = {
          ...(secretKey ? { "X-RBAC-SECRET-KEY": secretKey } : {}),
          ...(authorization ? { Authorization: authorization } : {}),
          "Cache-Control": "no-store",
        };

        const cacheKey = `${reqMethod}:${reqPath}:${authorization || ""}:${secretKey || ""}`;
        if (cache.get<boolean>(cacheKey)) {
          return next();
        }

        const existing = inFlight.get(cacheKey);
        if (existing) {
          await existing;
          cache.set(cacheKey, true);
        } else {
          const promise = (async () => {
            try {
              await subjectApi.authenticationIsAuthorized({
                params: {
                  permission: {
                    route: reqPath,
                    method: reqMethod,
                    type: "HTTP",
                  },
                },
                options: { headers },
              });
            } finally {
              inFlight.delete(cacheKey);
            }
          })();

          inFlight.set(cacheKey, promise);
          await promise;
          cache.set(cacheKey, true);
        }
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }

      return next();
    });
  }
}
