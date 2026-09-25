/**
 * `enforce` refuses to start when an authorization secret still carries the
 * shape of the removed `$RANDOM` generator (issue #273). `report` logs the same
 * findings and starts anyway; it exists for a deployment that cannot rotate in
 * the same maintenance window, and leaving it set is an explicit decision to
 * keep running on a guessable authorization bypass.
 */
export const API_SECRET_STRENGTH: "enforce" | "report" =
  process.env["API_SECRET_STRENGTH"] === "report" ? "report" : "enforce";

/**
 * Browser origins the API, Telegram and OpenAPI apps accept for credentialed
 * cross-origin requests: a comma-separated list such as
 * `https://example.com,https://admin.example.com`, each entry written the way
 * a browser sends `Origin` (scheme, host and port, no path). Empty, the
 * default, echoes every origin, which local development and tunnels rely on.
 * Read by `resolveCorsOrigin` in `@sps/backend-utils`.
 */
export const API_CORS_ALLOWED_ORIGINS =
  process.env["API_CORS_ALLOWED_ORIGINS"] || "";
