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
 * Whether an error response carries the stack trace and the cause chain
 * (issue #314). `brief` answers with the request id, method, path, status and
 * message; `full` adds `stack` and `cause`, which name server files and the
 * services a request passed through. Unset, the mode is `full` when `NODE_ENV`
 * is `development` or `test` and `brief` otherwise. An unset `NODE_ENV` counts
 * as a deployment because the Docker image and the deployer set none, so a
 * developer machine opts in with `API_ERROR_DETAILS=full`, which
 * `apps/api/create_env.sh` writes. In both modes the incident log records safe source locations
 * under the request id, and a caller presenting `RBAC_SECRET_KEY` receives the
 * full body.
 */
export const API_ERROR_DETAILS: "full" | "brief" =
  process.env["API_ERROR_DETAILS"] === "full" ||
  (process.env["API_ERROR_DETAILS"] !== "brief" &&
    ["development", "test"].includes(process.env["NODE_ENV"] ?? ""))
    ? "full"
    : "brief";

/**
 * Largest request body the API server accepts, in bytes. Bun answers a request
 * whose `Content-Length` is larger with `413 Payload Too Large` before any route
 * runs, and the request body limit middleware in `apps/api/app.ts` refuses a
 * body without a declared length once a route reads past it. Uploads pass
 * through the same server, so the value has to stay at least as large as the
 * largest upload a deployment accepts. The default is 128 MiB, the limit Bun
 * applies when the option is absent.
 */
export const API_MAX_REQUEST_BODY_BYTES =
  Number(process.env["API_MAX_REQUEST_BODY_BYTES"]) || 128 * 1024 * 1024;

/**
 * Bounds for requests the API sends to a URL that a caller supplied or stored
 * (issue #307): `create-from-url` downloads and observer pipeline steps.
 *
 * User downloads require public addresses, except for the exact image-generator
 * URL constructed by File Storage. Trusted observer steps may also use service
 * origins. `OUTBOUND_URL_ALLOWED_ORIGINS` grants both callers additional origins
 * (comma-separated, for example `http://crm:8080`); keep it empty unless needed.
 * `OUTBOUND_URL_TIMEOUT_MS` covers the whole exchange, DNS, redirects and body
 * included, and `OUTBOUND_URL_MAX_RESPONSE_BYTES` is the largest body read when
 * the caller sets no limit of its own.
 */
export const OUTBOUND_URL_ALLOWED_ORIGINS =
  process.env["OUTBOUND_URL_ALLOWED_ORIGINS"] || "";
export const OUTBOUND_URL_TIMEOUT_MS =
  Number(process.env["OUTBOUND_URL_TIMEOUT_MS"]) || 30 * 1000;
export const OUTBOUND_URL_MAX_RESPONSE_BYTES =
  Number(process.env["OUTBOUND_URL_MAX_RESPONSE_BYTES"]) || 50 * 1024 * 1024;

/**
 * Browser origins the API, Telegram and OpenAPI apps accept for credentialed
 * cross-origin requests: a comma-separated list such as
 * `https://example.com,https://admin.example.com`, each entry written the way
 * a browser sends `Origin` (scheme, host and port, no path). Empty, the
 * default, echoes every HTTP(S) origin, which local development and tunnels rely on.
 * Read by `resolveCorsOrigin` in `@sps/backend-utils`.
 */
export const API_CORS_ALLOWED_ORIGINS =
  process.env["API_CORS_ALLOWED_ORIGINS"] || "";
