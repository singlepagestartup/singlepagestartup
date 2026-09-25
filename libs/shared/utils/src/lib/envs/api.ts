/**
 * `enforce` refuses to start when an authorization secret still carries the
 * shape of the removed `$RANDOM` generator (issue #273). `report` logs the same
 * findings and starts anyway; it exists for a deployment that cannot rotate in
 * the same maintenance window, and leaving it set is an explicit decision to
 * keep running on a guessable authorization bypass.
 */
export const API_SECRET_STRENGTH: "enforce" | "report" =
  process.env["API_SECRET_STRENGTH"] === "report" ? "report" : "enforce";
