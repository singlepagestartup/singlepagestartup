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
 * `apps/api/create_env.sh` writes. In both modes the log keeps the full record
 * under the request id, and a caller presenting `RBAC_SECRET_KEY` receives the
 * full body.
 */
export const API_ERROR_DETAILS: "full" | "brief" =
  process.env["API_ERROR_DETAILS"] === "full" ||
  (process.env["API_ERROR_DETAILS"] !== "brief" &&
    ["development", "test"].includes(process.env["NODE_ENV"] ?? ""))
    ? "full"
    : "brief";
