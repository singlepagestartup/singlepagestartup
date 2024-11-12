import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
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
    regexPath: /\/api\/rbac\/subjects\/(is-authorized|me|init)/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/broadcast\/(channels|messages)/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication|registration)\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/sessions\/init/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/subjects\/logout/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/widgets\/?/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/[a-zA-Z0-9-]+-blocks\/?/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/rbac\/subjects\/me/,
    methods: ["GET"],
  },
  {
    regexPath: /\/api\/sps-third-parties\/telegrams\/[a-zA-Z0-9-]+\/webhook/,
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

      /**
       * Vercel doesn't to call equal endpoint, throws 508 Loop detected
       * But it't not a loop, because controller checks if secret key is present
       */
      if (secretKey && secretKey === process.env["RBAC_SECRET_KEY"]) {
        return next();
      }

      if (reqPath.includes("/api/rbac/sessions") && reqMethod === "POST") {
        if (!secretKey || secretKey !== RBAC_SECRET_KEY) {
          throw new HTTPException(401, {
            message: "Unauthorized",
          });
        }

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

        const isAuthorized = await subjectApi.isAuthorized({
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
