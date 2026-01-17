import { createMiddleware } from "hono/factory";
import { Provider as StoreProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

/**
 * Routes that are allowed to be accessed without authentication
 * @type {Array<{ regexPath: RegExp; methods: string[] }>}
 *
 * [..., {
 *   regexPath: /\/api\/rbac\/identities\/[a-zA-Z0-9-]+/,
 *   methods: ["GET"],
 * }]
 */
const notBillingRoutes: { regexPath: RegExp; methods: string[] }[] = [
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication)\/(\w+)?/,
    methods: ["POST"],
  },
];

export type IMiddlewareGeneric = {
  Variables: undefined;
};

export class Middleware {
  storeProvider: StoreProvider;
  private notBillingRoutes: Map<string, Set<string>>;

  constructor() {
    this.storeProvider = new StoreProvider({ type: KV_PROVIDER });
    this.notBillingRoutes = new Map();

    notBillingRoutes.forEach(({ regexPath, methods }) => {
      this.notBillingRoutes.set(regexPath.source, new Set(methods));
    });
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const route = c.req.path.toLowerCase();
      const secretKey =
        c.req.header("X-RBAC-SECRET-KEY") || getCookie(c, "rbac.secret-key");
      const token = authorization(c);

      const method = c.req.method;

      if (["GET"].includes(method)) {
        return await next();
      }

      for (const [pattern, methods] of this.notBillingRoutes.entries()) {
        if (new RegExp(pattern).test(route) && methods.has(method)) {
          return next();
        }
      }

      try {
        const headers = {};

        if (token) {
          headers["Authorization"] = token;
        } else if (secretKey) {
          headers["X-RBAC-SECRET-KEY"] = secretKey;
        }

        await rbacModuleSubjectApi.authenticationBillRoute({
          data: {},
          params: {
            permission: { route, method, type: "HTTP" },
          },
          options: {
            headers,
          },
        });
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }

      await next();

      for (const [pattern, methods] of this.notBillingRoutes.entries()) {
        if (new RegExp(pattern).test(route) && methods.has(method)) {
          return;
        }
      }

      // if (c.res.status >= 200 && c.res.status < 300) {
      //   if (method !== "GET") {
      //     if (!token || !RBAC_JWT_SECRET || !RBAC_SECRET_KEY) {
      //       return;
      //     }

      //     const resJson = await c.res.clone().json();
      //     const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      //     const contentType = c.req.header("content-type");
      //     let requestData: any = {};

      //     if (contentType?.includes("application/json")) {
      //       requestData = await c.req.json().catch(() => ({}));
      //     } else if (
      //       contentType?.includes("multipart/form-data") ||
      //       contentType?.includes("application/x-www-form-urlencoded")
      //     ) {
      //       const formData = await c.req.formData().catch(() => new FormData());
      //       requestData = Object.fromEntries(formData);
      //     }

      //     const parsedRequestData = { ...requestData };

      //     if (typeof parsedRequestData.data === "string") {
      //       try {
      //         parsedRequestData.data = JSON.parse(parsedRequestData.data);
      //       } catch (e) {
      //         // Keep original string if parsing fails
      //       }
      //     }

      //     if (parsedRequestData.file instanceof File) {
      //       parsedRequestData.file = {
      //         name: parsedRequestData.file.name,
      //         size: parsedRequestData.file.size,
      //         type: parsedRequestData.file.type,
      //       };
      //     }

      //     if (decoded["subject"]?.["id"]) {
      //       const subjectId = decoded["subject"]["id"];

      //       void (async () => {
      //         try {
      //           const rbacAction = await rbacActionApi.create({
      //             data: {
      //               payload: {
      //                 route: path
      //                   .replaceAll(API_SERVICE_URL, "")
      //                   .replaceAll(NEXT_PUBLIC_API_SERVICE_URL, ""),
      //                 method,
      //                 type: "HTTP",
      //                 requestData: parsedRequestData,
      //                 result: resJson,
      //               },
      //             },
      //             options: {
      //               headers: {
      //                 "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      //               },
      //             },
      //           });

      //           await rbacSubjectsToActionsApi.create({
      //             data: {
      //               subjectId,
      //               actionId: rbacAction.id,
      //             },
      //             options: {
      //               headers: {
      //                 "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      //               },
      //             },
      //           });

      //           await agentModuleAgentApi.telegramBot({
      //             data: {
      //               rbacModuleAction: rbacAction,
      //             },
      //             options: {
      //               headers: {
      //                 "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      //               },
      //             },
      //           });
      //         } catch (error) {
      //           logger.error(error);
      //         }
      //       })();
      //     }
      //   }
      // }

      return;
    });
  }
}
