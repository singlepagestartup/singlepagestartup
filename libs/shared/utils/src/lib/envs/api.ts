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
