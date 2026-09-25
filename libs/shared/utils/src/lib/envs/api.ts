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
 * Bounds for requests the API sends to a URL that a caller supplied or stored
 * (issue #307): `create-from-url` downloads and observer pipeline steps.
 *
 * Such a URL may point at the API and host service URLs, or at an origin listed
 * in `OUTBOUND_URL_ALLOWED_ORIGINS` (comma-separated, for example
 * `http://crm:8080`); any other host must resolve to public addresses only.
 * `OUTBOUND_URL_TIMEOUT_MS` covers the whole exchange, redirects and body
 * included, and `OUTBOUND_URL_MAX_RESPONSE_BYTES` is the largest body read when
 * the caller sets no limit of its own.
 */
export const OUTBOUND_URL_ALLOWED_ORIGINS =
  process.env["OUTBOUND_URL_ALLOWED_ORIGINS"] || "";
export const OUTBOUND_URL_TIMEOUT_MS =
  Number(process.env["OUTBOUND_URL_TIMEOUT_MS"]) || 30 * 1000;
export const OUTBOUND_URL_MAX_RESPONSE_BYTES =
  Number(process.env["OUTBOUND_URL_MAX_RESPONSE_BYTES"]) || 50 * 1024 * 1024;
