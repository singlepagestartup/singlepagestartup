import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import * as jwt from "hono/jwt";

export interface IMiddlewareGeneric {}

export class Middleware {
  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      try {
        if (!RBAC_JWT_SECRET) {
          throw new Error("Configuration error. RBAC_JWT_SECRET not set");
        }

        if (!RBAC_SECRET_KEY) {
          throw new Error("Configuration error. RBAC_SECRET_KEY not set");
        }

        const secretKey =
          c.req.header("X-RBAC-SECRET-KEY") || getCookie(c, "rbac.secret-key");

        const id = c.req.param("id");

        if (!id) {
          throw new Error("Validation error. No id provided");
        }

        if (!secretKey) {
          const token = authorization(c);

          if (!token) {
            throw new Error(
              "Authentication error. Unauthorized. No JWT token provided",
            );
          }

          const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

          if (decoded?.["subject"]?.["id"] !== id) {
            throw new Error(
              "Authentication error. Unauthorized. Only profile owner can get access",
            );
          }
        } else {
          if (secretKey !== RBAC_SECRET_KEY) {
            throw new Error(
              "Authentication error. Unauthorized. Wrong secret key",
            );
          }
        }

        return next();
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}
