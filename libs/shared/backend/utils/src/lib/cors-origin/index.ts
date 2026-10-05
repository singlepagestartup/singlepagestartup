import { API_CORS_ALLOWED_ORIGINS } from "@sps/shared-utils";

/**
 * Chooses the `Access-Control-Allow-Origin` value for the API, Telegram and
 * OpenAPI apps, which answer browsers with credentials allowed. Passed as the
 * `origin` option of `hono/cors`, so returning `null` sends no allow-origin
 * header and the browser keeps the response from the calling page.
 *
 * With `API_CORS_ALLOWED_ORIGINS` empty, the default, any origin is echoed
 * back: local development, tunnels and front ends on other domains keep
 * working without configuration. With a list set, only an origin equal to one
 * of its entries is echoed. A request without an `Origin` header, such as a
 * server-to-server call, gets no allow-origin header either way; CORS does not
 * refuse it and its handler answers as before.
 */
export function resolveCorsOrigin(origin: string): string | null {
  if (!origin) {
    return null;
  }

  const allowedOrigins = API_CORS_ALLOWED_ORIGINS.split(",")
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean);

  if (!allowedOrigins.length) {
    return origin;
  }

  return allowedOrigins.includes(origin) ? origin : null;
}
