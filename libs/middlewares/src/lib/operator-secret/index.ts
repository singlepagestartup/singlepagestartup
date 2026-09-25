import { rbacSecretMatches, readRbacSecret } from "@sps/backend-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export type IMiddlewareGeneric = unknown;

/**
 * One response for every rejection. The caller must not be able to tell a
 * missing credential from a wrong one, or either from a service that has no
 * credential configured.
 */
const UNAUTHORIZED_MESSAGE = "Unauthorized";

/**
 * Guards a service control route that only an operator may call.
 *
 * The credential itself is read and compared by `@sps/backend-utils` (issue
 * #276), so this middleware decides only what a refusal looks like. Sharing
 * that primitive is the point: the operator secret arrives only in the
 * `X-RBAC-SECRET-KEY` header, it is compared in constant time, and an
 * unconfigured secret refuses every caller — and none of that should be
 * decided twice.
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
