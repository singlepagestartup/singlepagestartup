import {
  HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
  STALE_TIME,
  UUID_PATH_SUFFIX_REGEX,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { websocketManager } from "@sps/backend-utils";

export type IMiddlewareGeneric = unknown;

export class Middleware {
  constructor() {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const path = c.req.path;
      const method = c.req.method;

      await next();

      if (path.includes("/api/broadcast")) {
        return;
      }

      if (c.res.status >= 200 && c.res.status < 300) {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          if (!RBAC_SECRET_KEY) {
            throw Error(
              "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
            );
          }

          websocketManager.broadcastMessage({
            slug: "revalidation",
            payload: path,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + STALE_TIME * 5).toISOString(),
          });

          this.revalidateTag(path);

          const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");

          websocketManager.broadcastMessage({
            slug: "revalidation",
            payload: pathWithoutId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + STALE_TIME * 5).toISOString(),
          });

          this.revalidateTag(pathWithoutId);
        }

        if (["DELETE"].includes(method)) {
          const pathWithoutId = path.replace(UUID_PATH_SUFFIX_REGEX, "");

          websocketManager.broadcastMessage({
            slug: "revalidation",
            payload: pathWithoutId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + STALE_TIME * 5).toISOString(),
          });

          await this.revalidateTag(pathWithoutId);
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
