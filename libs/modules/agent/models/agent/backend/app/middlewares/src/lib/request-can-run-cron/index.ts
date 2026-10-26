import {
  rbacSecretMatches,
  readRbacSecret,
  secretMatches,
} from "@sps/backend-utils";
import { AGENT_CRON_SECRET } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export interface IMiddlewareGeneric {}

/**
 * The header the server crontab sends. It carries `AGENT_CRON_SECRET`, which
 * opens the cron route and nothing else.
 */
const AGENT_CRON_SECRET_HEADER = "X-AGENT-CRON-SECRET";

/**
 * One response for every refusal, the one the operator-secret middleware gives:
 * a caller cannot tell which credential was missing or wrong.
 */
const UNAUTHORIZED_MESSAGE = "Unauthorized";

/**
 * Guards the agent cron trigger. The is-authorized allow-list lets the route
 * through, so this guard is the whole access check, and it admits two
 * credentials, both compared in constant time by `@sps/backend-utils`:
 *
 * - the operator secret, read from `X-RBAC-SECRET-KEY` or the `rbac.secret-key`
 *   cookie as every operator guard reads it;
 * - `AGENT_CRON_SECRET` in `X-AGENT-CRON-SECRET`, which the server crontab holds
 *   instead of the operator secret.
 *
 * An unset `AGENT_CRON_SECRET` matches nobody, so the route then opens to the
 * operator secret alone.
 */
export class Middleware {
  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      if (
        rbacSecretMatches(readRbacSecret(c)) ||
        secretMatches(AGENT_CRON_SECRET, c.req.header(AGENT_CRON_SECRET_HEADER))
      ) {
        return next();
      }

      throw new HTTPException(401, { message: UNAUTHORIZED_MESSAGE });
    });
  }
}
