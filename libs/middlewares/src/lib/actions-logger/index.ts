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

          if (decoded["subject"]?.["id"]) {
            const subjectId = decoded["subject"]["id"];

            const rbacAction = await rbacActionApi.create({
              data: {
                payload: {
                  route: path
                    .replaceAll(API_SERVICE_URL, "")
                    .replaceAll(NEXT_PUBLIC_API_SERVICE_URL, ""),
                  method,
                  type: "HTTP",
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
          }
        }
      }

      return;
    });
  }
}
