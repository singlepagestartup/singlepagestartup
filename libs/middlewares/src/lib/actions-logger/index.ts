import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  API_SERVICE_URL,
  KV_PROVIDER,
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { authorization } from "@sps/backend-utils";
import * as jwt from "hono/jwt";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";
import { api as rbacSubjectsToActionsApi } from "@sps/rbac/relations/subjects-to-actions/sdk/server";
import { api as agentModuleAgentApi } from "@sps/agent/models/agent/sdk/server";

export type IMiddlewareGeneric = {
  Variables: undefined;
};

export class Middleware {
  storeProvider: StoreProvider;

  constructor() {
    this.storeProvider = new StoreProvider({ type: KV_PROVIDER });
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const path = c.req.url.split("?")?.[0];
      const token = authorization(c);

      const method = c.req.method;

      await next();

      if (c.res.status >= 200 && c.res.status < 300) {
        if (method !== "GET") {
          if (!token || !RBAC_JWT_SECRET || !RBAC_SECRET_KEY) {
            return;
          }

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
            const formData = await c.req.formData().catch(() => new FormData());
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

            rbacActionApi
              .create({
                data: {
                  payload: {
                    route: path
                      .replaceAll(API_SERVICE_URL, "")
                      .replaceAll(NEXT_PUBLIC_API_SERVICE_URL, ""),
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
              })
              .then((rbacAction) => {
                if (!RBAC_SECRET_KEY) {
                  return;
                }

                rbacSubjectsToActionsApi
                  .create({
                    data: {
                      subjectId,
                      actionId: rbacAction.id,
                    },
                    options: {
                      headers: {
                        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                      },
                    },
                  })
                  .then(() => {
                    if (!RBAC_SECRET_KEY) {
                      return;
                    }

                    return agentModuleAgentApi.telegramBot({
                      data: {
                        rbacModuleAction: rbacAction,
                      },
                      options: {
                        headers: {
                          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                        },
                      },
                    });
                  });
              });
          }
        }
      }

      return;
    });
  }
}
