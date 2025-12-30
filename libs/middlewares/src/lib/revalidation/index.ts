import {
  HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
  STALE_TIME,
  UUID_PATH_SEGMENT_REGEX,
  UUID_PATH_SUFFIX_REGEX,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { websocketManager } from "@sps/backend-utils";

export type IMiddlewareGeneric = unknown;

/**
 * Routes that are allowed to be accessed without authentication
 * @type {Array<{ regexPath: RegExp; methods: string[] }>}
 *
 * [..., {
 *   regexPath: /\/api\/rbac\/identities\/[a-zA-Z0-9-]+/,
 *   methods: ["GET"],
 * }]
 */
const notRevalidatingRoutes: { regexPath: RegExp; methods: string[] }[] = [
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication)\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/broadcast\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/actions/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/actions\/(\w+)?/,
    methods: ["POST"],
  },
];

export class Middleware {
  private notRevalidatingRoutes: Map<string, Set<string>>;

  constructor() {
    this.notRevalidatingRoutes = new Map();

    notRevalidatingRoutes.forEach(({ regexPath, methods }) => {
      this.notRevalidatingRoutes.set(regexPath.source, new Set(methods));
    });
  }

  private getNormalizedPaths(path: string): string[] {
    const normalizedPath = path.split("?")[0];
    const pathWithoutLastId = normalizedPath.replace(
      UUID_PATH_SUFFIX_REGEX,
      "",
    );
    const pathWithoutAllIds = normalizedPath.replace(
      UUID_PATH_SEGMENT_REGEX,
      "",
    );
    const basePath = normalizedPath.split("/").slice(0, 4).join("/");

    return Array.from(
      new Set([normalizedPath, pathWithoutLastId, pathWithoutAllIds, basePath]),
    ).filter(Boolean);
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const reqPath = c.req.path.toLowerCase();
      const path = c.req.path;
      const method = c.req.method;

      await next();

      for (const [pattern, methods] of this.notRevalidatingRoutes.entries()) {
        if (new RegExp(pattern).test(reqPath) && methods.has(method)) {
          return;
        }
      }

      if (c.res.status >= 200 && c.res.status < 300) {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          if (!RBAC_SECRET_KEY) {
            throw Error(
              "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
            );
          }

          const pathsToRevalidate = this.getNormalizedPaths(path);
          const timestamp = new Date().toISOString();
          const expiresAt = new Date(Date.now() + STALE_TIME * 5).toISOString();

          pathsToRevalidate.forEach((payload) => {
            websocketManager.broadcastMessage({
              slug: "revalidation",
              payload,
              createdAt: timestamp,
              expiresAt,
            });

            void this.revalidateTag(payload);
          });
        }
      }
    });
  }

  async revalidateTag(tag: string) {
    try {
      await fetch(HOST_SERVICE_URL + "/api/revalidate?tag=" + tag);
    } catch (error) {
      console.log("🚀 ~ revalidateTag ~ error:", error);
    }
  }
}
