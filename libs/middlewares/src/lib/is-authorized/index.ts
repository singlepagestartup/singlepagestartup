import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import {
  NEXT_PUBLIC_HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { getCookie } from "hono/cookie";
import { getHttpErrorType } from "@sps/backend-utils";
/**
 * Routes that are allowed to be accessed without authentication
 * @type {Array<{ regexPath: RegExp; methods: string[] }>}
 *
 * [..., {
 *   regexPath: /\/api\/rbac\/identities\/[a-zA-Z0-9-]+/,
 *   methods: ["GET"],
 * }]
 */
const allowedRoutes: { regexPath: RegExp; methods: string[] }[] = [
  {
    regexPath: /\/favicon.ico/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/broadcast\/channels/,
    methods: ["GET"],
  },
  {
    regexPath:
      /\/api\/rbac\/subjects\/authentication\/(is-authorized|me|init|refresh)/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication)\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/public\/file-storage\/.*/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/(host|website-builder|file-storage)\/.*/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/aws-ses/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/http-cache\/clear/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/revalidation\/revalidate/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/permissions$/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/permissions\/.*/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/telegram/,
    methods: ["POST"],
  },
];

export class Middleware {
  private allowedRoutes: Map<string, Set<string>>;

  constructor() {
    this.allowedRoutes = new Map();

    allowedRoutes.forEach(({ regexPath, methods }) => {
      this.allowedRoutes.set(regexPath.source, new Set(methods));
    });
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

      for (const [pattern, methods] of this.allowedRoutes.entries()) {
        if (new RegExp(pattern).test(reqPath) && methods.has(reqMethod)) {
          return next();
        }
      }

      try {
        const headers: HeadersInit = {
          ...(secretKey ? { "X-RBAC-SECRET-KEY": secretKey } : {}),
          ...(authorization ? { Authorization: authorization } : {}),
          "Cache-Control": "no-store",
        };

        const isAuthorized = await subjectApi.authenticationIsAuthorized({
          params: {
            permission: { route: reqPath, method: reqMethod, type: "HTTP" },
          },
          options: { headers },
        });
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }

      return next();
    });
  }
}
