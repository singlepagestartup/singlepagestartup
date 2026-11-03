import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { readRbacSecret, rbacSecretMatches } from "@sps/backend-utils";
export class Middleware {
  init() {
    return createMiddleware(async (c, next) => {
      if (!rbacSecretMatches(readRbacSecret(c)))
        throw new HTTPException(403, {
          message: "Operator credentials required",
        });
      return next();
    });
  }
}
