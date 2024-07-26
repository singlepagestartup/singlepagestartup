import { SPS_RBAC_SECRET_KEY } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { api as channelApi } from "@sps/sps-broadcast/models/channel/sdk/server";

export type IMiddlewareGeneric = unknown;

export class Middleware {
  constructor() {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const path = c.req.path;
      const method = c.req.method;

      await next();

      if (
        path.includes("/api/sps-broadcast") ||
        path.includes("/api/sps-rbac")
      ) {
        return;
      }

      if (c.res.status >= 200 && c.res.status < 300) {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          if (!SPS_RBAC_SECRET_KEY) {
            throw Error(
              "SPS_RBAC_SECRET_KEY is not defined, sps-broadcast middleware 'revalidation' can't request to service.",
            );
          }

          if (["POST", "PUT", "PATCH"].includes(method)) {
            await channelApi.pushMessage({
              data: { channelName: "revalidation", payload: path },
              options: {
                headers: {
                  "X-SPS-RBAC-SECRET-KEY": SPS_RBAC_SECRET_KEY,
                },
                next: {
                  cache: "no-store",
                },
              },
            });
          }
          if (["DELETE"].includes(method)) {
            const pathWithoutId = path.replace(/\/[a-zA-Z0-9-]+$/, "");

            await channelApi.pushMessage({
              data: { channelName: "revalidation", payload: pathWithoutId },
              options: {
                headers: {
                  "X-SPS-RBAC-SECRET-KEY": SPS_RBAC_SECRET_KEY,
                },
                next: {
                  cache: "no-store",
                },
              },
            });
          }
        }
      }

      return;
    });
  }
}
