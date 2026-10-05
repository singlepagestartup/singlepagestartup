import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import {
  IRouteRule,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  RBAC_PRIVILEGED_CONTEXT_KEY,
  RBAC_REVOKED_SUBJECT_CONTEXT_KEY,
  RBAC_SECRET_KEY,
  RouteMatcher,
  createMemoryCache,
} from "@sps/shared-utils";
import { Context, MiddlewareHandler } from "hono";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { getCookie } from "hono/cookie";
import { decode } from "hono/jwt";
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
      const proceed = async () => {
        await next();

        this.markRevokedSubject(c);
      };

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
        /**
         * Marks the operator caller so the REST boundary skips a model's
         * `outputSchema` stripping (issue #270): the framework's own login,
         * OAuth linking and wallet login read identity secret columns back
         * over loopback HTTP with this key.
         */
        c.set(RBAC_PRIVILEGED_CONTEXT_KEY, true);

        return next();
      }

      if (this.allowedRoutesMatcher.matches(reqPath, reqMethod)) {
        return proceed();
      }

      try {
        const headers: Record<string, string> = {
          ...(secretKey ? { "X-RBAC-SECRET-KEY": secretKey } : {}),
          ...(authorization ? { Authorization: authorization } : {}),
          "Cache-Control": "no-store",
        };

        const cacheKey = `${reqMethod}:${reqPath}:${authorization || ""}:${secretKey || ""}`;
        if (
          cache.get<boolean>(cacheKey) &&
          !this.isSubjectRevoked(authorization)
        ) {
          return proceed();
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

      return proceed();
    });
  }

  /**
   * A handler that revokes the tokens of a subject, as logout does, names the
   * subject in the request context. For as long as cached decisions can live,
   * no token of that subject is answered from them, so the next request with
   * any of its tokens reaches the subject service, which refuses it.
   */
  private markRevokedSubject(c: Context) {
    const subjectId = c.get(RBAC_REVOKED_SUBJECT_CONTEXT_KEY);

    if (typeof subjectId === "string" && subjectId) {
      cache.set(`revoked-subject:${subjectId}`, true);
    }
  }

  /**
   * Whether the subject a token names logged out within the cache lifetime.
   * The payload is read without verification because it only decides whether
   * a cached decision may be reused: a forged token can make a request skip
   * the cache, never pass it.
   */
  private isSubjectRevoked(authorization?: string) {
    if (!authorization) {
      return false;
    }

    try {
      const subject = decode(authorization).payload["subject"] as
        | { id?: unknown }
        | undefined;

      return (
        typeof subject?.id === "string" &&
        Boolean(cache.get<boolean>(`revoked-subject:${subject.id}`))
      );
    } catch {
      return false;
    }
  }
}
