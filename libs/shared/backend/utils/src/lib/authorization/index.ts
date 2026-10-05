import { Context } from "hono";

/**
 * Reads the subject JWT from a request's `Authorization` header, with or
 * without the `Bearer ` prefix.
 *
 * The browser keeps its session in its own cookie on the host origin and
 * sends it as this header. The API neither writes nor reads a session cookie,
 * so no cookie authenticates a request.
 */
export function util(c: Context) {
  return c.req.header("Authorization")?.replace("Bearer ", "");
}
