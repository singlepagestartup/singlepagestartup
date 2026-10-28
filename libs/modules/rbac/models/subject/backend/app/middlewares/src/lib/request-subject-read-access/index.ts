import { authorization, getHttpErrorType, verifyJwt } from "@sps/backend-utils";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { type MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../api/src/lib/service";

export class Middleware {
  constructor(private readonly service: Pick<Service, "isAuthorized">) {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      // Route middleware also matches later handlers for other HTTP methods.
      if (c.req.method !== "GET") return next();

      try {
        const id = c.req.param("uuid") || c.req.param("id");
        if (!id) throw new Error("Validation error. No id provided");

        const secretKey =
          c.req.header("X-RBAC-SECRET-KEY") || getCookie(c, "rbac.secret-key");
        if (secretKey) {
          if (!RBAC_SECRET_KEY || secretKey !== RBAC_SECRET_KEY) {
            throw new Error("Authentication error. Invalid credentials");
          }
          return next();
        }

        const token = authorization(c);
        if (!token) throw new Error("Authentication error. Token required");
        if (!RBAC_JWT_SECRET) {
          throw new Error("Configuration error. RBAC_JWT_SECRET not set");
        }

        const decoded = await verifyJwt(token, RBAC_JWT_SECRET);
        const subjectId = decoded.subject?.["id"];
        if (typeof subjectId !== "string" || !subjectId) {
          throw new Error(
            "Authentication error. No subject provided in the token",
          );
        }

        if (subjectId !== id) {
          await this.service.isAuthorized({
            permission: { route: c.req.path, method: "GET", type: "HTTP" },
            authorization: { value: token },
          });
        }

        return next();
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}
