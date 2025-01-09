import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { HOST_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { getCookie } from "hono/cookie";
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
    regexPath: /\/api\/broadcast\/(channels|messages)/,
    methods: ["GET"],
  },
  {
    regexPath:
      /\/api\/rbac\/subjects\/authentication\/(is-authorized|me|init|logout)/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication)\/(\w+)?/,
    methods: ["POST"],
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
    regexPath: /\/api\/telegram/,
    methods: ["POST"],
  },
];

export class Middleware {
  constructor() {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const reqMethod = c.req.method;
      const reqPath = c.req.path;
      const secretKeyHeaders = c.req.header("X-RBAC-SECRET-KEY");
      const secretKeyCookie = getCookie(c, "rbac.secret-key");
      const secretKey = secretKeyHeaders || secretKeyCookie;
      const authorizationCookie = getCookie(c, "rbac.subject.jwt");
      const authorizationHeader = c.req.header("Authorization");
      const authorization =
        authorizationCookie || authorizationHeader?.replace("Bearer ", "");

      const origin = c.req.header("Host");
      const allowedOrigins = ["http://localhost:3000", HOST_URL];

      if (origin && allowedOrigins.includes(origin)) {
        c.res.headers["Access-Control-Allow-Origin"] = origin;
      }

      /**
       * Vercel doesn't to call equal endpoint, throws 508 Loop detected
       * But it't not a loop, because controller checks if secret key is present
       */
      if (secretKey && secretKey === RBAC_SECRET_KEY) {
        return next();
      }

      const matchedRoute = allowedRoutes.find((route) => {
        return route.regexPath.test(reqPath);
      });

      if (matchedRoute && matchedRoute.methods.includes(reqMethod)) {
        return next();
      }

      try {
        const headers = secretKey
          ? { "X-RBAC-SECRET-KEY": secretKey }
          : authorization
            ? { Authorization: authorization }
            : ({} as HeadersInit);

        const isAuthorized = await subjectApi.authenticationIsAuthorized({
          params: {
            action: {
              route: reqPath.toLowerCase(),
              method: reqMethod.toUpperCase(),
              type: "HTTP",
            },
          },
          options: {
            headers,
            next: {
              cache: "no-store",
            },
          },
        });
      } catch (error: any) {
        throw new HTTPException(401, {
          message: error["message"],
        });
      }

      return next();
    });
  }
}
