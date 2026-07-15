import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  IRouteRule,
  KV_PROVIDER,
  normalizeRoutePath,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
  RouteMatcher,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { authorization, logger } from "@sps/backend-utils";
import * as jwt from "hono/jwt";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";
import { api as rbacSubjectsToActionsApi } from "@sps/rbac/relations/subjects-to-actions/sdk/server";
import { api as agentModuleAgentApi } from "@sps/agent/models/agent/sdk/server";
import { createLoggingRoutesMatcher } from "./routes";

export type IMiddlewareGeneric = {
  Variables: undefined;
};

/**
 * Project extension seam: framework consumers register routes whose mutations
 * are logged as RBAC actions via constructor options, merged with the
 * framework defaults (`routes/singlepage.ts`) and the project layer
 * (`routes/startup.ts`).
 */
export interface IMiddlewareOptions {
  loggingRoutes?: IRouteRule[];
}

export class Middleware {
  storeProvider: StoreProvider;
  private loggingRoutesMatcher: RouteMatcher;

  constructor(options?: IMiddlewareOptions) {
    this.storeProvider = new StoreProvider({ type: KV_PROVIDER });
    this.loggingRoutesMatcher = createLoggingRoutesMatcher(
      options?.loggingRoutes,
    );
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const reqPath = c.req.path.toLowerCase();
      const path = normalizeRoutePath(c.req.path);
      const token = authorization(c);

      const method = c.req.method;

      await next();

      if (!this.loggingRoutesMatcher.matches(reqPath, method)) {
        return;
      }

      if (c.res.headers.get("X-SPS-SKIP-ACTION-LOGGER") === "1") {
        return;
      }

      if (c.res.status >= 200 && c.res.status < 300) {
        if (method !== "GET") {
          if (!token || !RBAC_JWT_SECRET || !RBAC_SECRET_KEY) {
            return;
          }

          void (async () => {
            try {
              const resJson = await c.res.clone().json();
              const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

              const contentType = c.req.header("content-type");
              let requestData: any = {};

              if (contentType?.includes("application/json")) {
                requestData = await c.req.json().catch(() => ({}));
              } else if (
                contentType?.includes("multipart/form-data") ||
                contentType?.includes("application/x-www-form-urlencoded")
              ) {
                const formData = await c.req
                  .formData()
                  .catch(() => new FormData());
                requestData = Object.fromEntries(formData);
              }

              const parsedRequestData = { ...requestData };

              if (typeof parsedRequestData.data === "string") {
                try {
                  parsedRequestData.data = JSON.parse(parsedRequestData.data);
                } catch (e) {
                  // Keep original string if parsing fails
                }
              }

              if (parsedRequestData.file instanceof File) {
                parsedRequestData.file = {
                  name: parsedRequestData.file.name,
                  size: parsedRequestData.file.size,
                  type: parsedRequestData.file.type,
                };
              }

              if (decoded["subject"]?.["id"]) {
                const subjectId = decoded["subject"]["id"];

                void (async () => {
                  try {
                    const rbacAction = await rbacActionApi.create({
                      data: {
                        payload: {
                          route: path,
                          method,
                          type: "HTTP",
                          requestData: parsedRequestData,
                          result: resJson,
                        },
                      },
                      options: {
                        headers: {
                          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                        },
                      },
                    });

                    await rbacSubjectsToActionsApi.create({
                      data: {
                        subjectId,
                        actionId: rbacAction.id,
                      },
                      options: {
                        headers: {
                          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                        },
                      },
                    });

                    await agentModuleAgentApi.telegramBot({
                      data: {
                        rbacModuleAction: rbacAction,
                      },
                      options: {
                        headers: {
                          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                        },
                      },
                    });
                  } catch (error) {
                    logger.error(error);
                  }
                })();
              }
            } catch (error) {
              //
            }
          })();
        }
      }

      return;
    });
  }
}
