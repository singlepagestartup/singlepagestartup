import {
  authorization,
  getHttpErrorType,
  readRbacSecret,
  rbacSecretMatches,
} from "@sps/backend-utils";
import { type MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../api/src/lib/service";

export class Middleware {
  constructor(private readonly service: Pick<Service, "isAuthorized" | "me">) {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      // Route middleware also matches later handlers for other HTTP methods.
      if (c.req.method !== "GET") {
        return next();
      }

      try {
        const id = c.req.param("uuid") || c.req.param("id");
        if (!id) {
          throw new Error("Validation error. No id provided");
        }

        const secretKey = readRbacSecret(c);
        if (secretKey) {
          if (!rbacSecretMatches(secretKey)) {
            throw new Error("Authentication error. Invalid credentials");
          }
          return next();
        }

        const token = authorization(c);
        if (!token) {
          throw new Error("Authentication error. Token required");
        }

        const subject = await this.service.me({ token });

        if (!subject) {
          throw new Error("Authentication error. Subject not found");
        }

        if (subject.id !== id) {
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
