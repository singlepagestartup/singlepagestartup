import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { rbacSecretMatches, readRbacSecret } from "@sps/backend-utils";

export type IMiddlewareGeneric = unknown;

/**
 * One answer for every refusal. A caller must not be able to tell a missing
 * credential from a wrong one, or either from a deployment that configured no
 * secret at all.
 */
const UNAUTHORIZED_MESSAGE = "Unauthorized";

/**
 * Guards a route that only an operator holding the RBAC secret may call,
 * independently of the is-authorized allow-list: the guard travels with the
 * route definition, so it holds wherever the route is registered.
 */
export class Middleware {
  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      if (!rbacSecretMatches(readRbacSecret(c))) {
        throw new HTTPException(401, { message: UNAUTHORIZED_MESSAGE });
      }

      return next();
    });
  }
}
