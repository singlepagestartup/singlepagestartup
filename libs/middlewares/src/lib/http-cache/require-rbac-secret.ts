import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { rbacSecretMatches, readRbacSecret } from "@sps/backend-utils";

/**
 * One answer for every refusal. A caller must not be able to tell a missing
 * credential from a wrong one, or either from a deployment that configured no
 * secret at all.
 */
const UNAUTHORIZED_MESSAGE = "Unauthorized";

/**
 * Route guard for the operator endpoints this middleware registers.
 *
 * It is composed into the route definition rather than applied to the app,
 * because `setRoutes` runs before `is-authorized` is registered
 * (`apps/api/app.ts`): a handler matched at that position answers before the
 * authorization middleware is ever reached, so neither the allow-list nor a
 * project's deny rule can refuse a caller here. Bound to the route, the guard
 * holds wherever the route is registered (issue #277).
 */
export function requireRbacSecret(): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    if (!rbacSecretMatches(readRbacSecret(c))) {
      throw new HTTPException(401, { message: UNAUTHORIZED_MESSAGE });
    }

    return next();
  });
}
