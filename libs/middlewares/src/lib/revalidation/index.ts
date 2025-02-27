import {
  HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
  STALE_TIME,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { websocketManager } from "@sps/backend-utils"; // Импорт WebSocket Manager

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

          await this.revalidateTag(path);
        }

        if (["POST", "DELETE"].includes(method)) {
          const pathWithoutId = path.replace(
            /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?*/,
            "",
          );

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
