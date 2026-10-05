import { timingSafeEqual } from "node:crypto";
import { Context } from "hono";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

/**
 * Reads the operator credential from a request's `X-RBAC-SECRET-KEY` header.
 *
 * The secret is a service credential: Telegram, the agents, the cron jobs and
 * the API's own loopback calls send it as this header. A cookie is never read,
 * so a browser never presents the secret by attaching a stored cookie.
 */
export function readRbacSecret(c: Context): string | undefined {
  return c.req.header("X-RBAC-SECRET-KEY");
}

/**
 * Compares a caller-supplied credential with the configured `RBAC_SECRET_KEY`
 * in constant time.
 *
 * A deployment that configures no secret matches nobody: a guard standing on an
 * unset variable must refuse every caller rather than admit every caller.
 */
export function rbacSecretMatches(provided?: string | null): boolean {
  if (!RBAC_SECRET_KEY || !provided) {
    return false;
  }

  const expected = Buffer.from(RBAC_SECRET_KEY, "utf8");
  const candidate = Buffer.from(provided, "utf8");

  // timingSafeEqual throws on buffers of different sizes, so the length is
  // compared first and is the one bit this comparison cannot hide.
  return (
    expected.length === candidate.length && timingSafeEqual(expected, candidate)
  );
}
