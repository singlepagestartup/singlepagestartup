import { timingSafeEqual } from "node:crypto";
import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

/**
 * Reads the operator credential from a request: the `X-RBAC-SECRET-KEY` header
 * first, then the `rbac.secret-key` cookie. Both are what the is-authorized
 * middleware already accepts, so a guard built on this helper does not narrow
 * the documented ways of presenting the secret.
 */
export function readRbacSecret(c: Context): string | undefined {
  return c.req.header("X-RBAC-SECRET-KEY") || getCookie(c, "rbac.secret-key");
}

/**
 * Compares a caller-supplied credential with a configured secret in constant
 * time.
 *
 * A deployment that configures no secret matches nobody: a guard standing on an
 * unset variable must refuse every caller rather than admit every caller.
 */
export function secretMatches(
  configured?: string | null,
  provided?: string | null,
): boolean {
  if (!configured || !provided) {
    return false;
  }

  const expected = Buffer.from(configured, "utf8");
  const candidate = Buffer.from(provided, "utf8");

  // timingSafeEqual throws on buffers of different sizes, so the length is
  // compared first and is the one bit this comparison cannot hide.
  return (
    expected.length === candidate.length && timingSafeEqual(expected, candidate)
  );
}

/**
 * Compares a caller-supplied credential with the configured `RBAC_SECRET_KEY`
 * through `secretMatches`.
 */
export function rbacSecretMatches(provided?: string | null): boolean {
  return secretMatches(RBAC_SECRET_KEY, provided);
}
