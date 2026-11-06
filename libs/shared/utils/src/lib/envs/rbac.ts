export const RBAC_COOKIE_SESSION_SECRET =
  process.env["RBAC_COOKIE_SESSION_SECRET"];
export const RBAC_COOKIE_SESSION_EXPIRATION_SECONDS =
  process.env["RBAC_COOKIE_SESSION_EXPIRATION_SECONDS"] || "3600"; // 1 hour
export const RBAC_COOKIE_SESSION_NAME =
  process.env["RBAC_COOKIE_SESSION_NAME"] || "rbac_ce_sn";
export const RBAC_SECRET_KEY = process.env["RBAC_SECRET_KEY"];
export const RBAC_SESSION_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_SESSION_LIFETIME_IN_SECONDS"]) || Number("3600"); // 1 hour
export const RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS"]) ||
  Number(process.env["NEXT_PUBLIC_RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS"]) ||
  Number("3600"); // 1 hour
export const RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS"]) ||
  Number("2419200"); // 28 days
export const RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS"]) ||
  Number("86400"); // 1 day
export const RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS =
  Number(process.env["RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS"]) ||
  Number("3600"); // 1 hour
export const RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS =
  Number(process.env["RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS"]) ||
  Number("2592000"); // 30 days
export const RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE =
  Number(process.env["RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE"]) ||
  Number("500");
export const RBAC_JWT_SECRET = process.env["RBAC_JWT_SECRET"];
export const WALLET_CONNECT_PROJECT_ID =
  process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] || "";

export const RBAC_OAUTH_GOOGLE_CLIENT_ID =
  process.env["RBAC_OAUTH_GOOGLE_CLIENT_ID"] || "";
export const RBAC_OAUTH_GOOGLE_CLIENT_SECRET =
  process.env["RBAC_OAUTH_GOOGLE_CLIENT_SECRET"] || "";
export const RBAC_OAUTH_GOOGLE_REDIRECT_URI =
  process.env["RBAC_OAUTH_GOOGLE_REDIRECT_URI"] || "";
export const RBAC_OAUTH_SUCCESS_REDIRECT_PATH =
  process.env["RBAC_OAUTH_SUCCESS_REDIRECT_PATH"] || "/";
export const RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS"]) || 600;
export const RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS"]) || 120;
/**
 * Compatibility knob for one release. The exchange code is a session-granting
 * credential, so it now travels in an HttpOnly cookie instead of the redirect
 * query string. A deployment whose API and host sit on different registrable
 * domains never receives that cookie on the `SameSite=Lax` exchange POST, and
 * sets this to `true` until the two are brought onto one site.
 */
export const RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY =
  process.env["RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY"] === "true";

/**
 * Attempt budgets for the authentication routes and for requests that carry a
 * wrong operator secret (issue #310). A budget covers one fixed window of
 * `RBAC_RATE_LIMIT_WINDOW_IN_SECONDS` and is counted in the KV store, so every
 * API process spends the same budget. A caller over a budget is answered 429
 * with `Retry-After` until its window ends.
 *
 * - `RBAC_RATE_LIMIT_ENABLED=false` turns counting and refusals off, for load
 *   tests. Wrong operator secrets are logged either way.
 * - `RBAC_RATE_LIMIT_TRUSTED_PROXIES` is the number of reverse proxies in front
 *   of the API that append to `X-Forwarded-For`. The deployer runs one
 *   (Traefik); `0` means clients connect to the API directly. An address from a
 *   private network is never counted, so behind the swarm routing mesh, which
 *   hands the API one ingress address for every visitor, only the account
 *   budgets apply.
 * - Credential routes (login, registration, wallet login, forgot-password,
 *   reset-password) each count per client address; login also counts per
 *   `login` and forgot-password per `email`.
 * - Session routes (`init`, `refresh`) count per client address.
 */
export const RBAC_RATE_LIMIT_ENABLED =
  process.env["RBAC_RATE_LIMIT_ENABLED"] !== "false";
export const RBAC_RATE_LIMIT_WINDOW_IN_SECONDS =
  Number(process.env["RBAC_RATE_LIMIT_WINDOW_IN_SECONDS"]) || 60;
export const RBAC_RATE_LIMIT_TRUSTED_PROXIES = Number(
  process.env["RBAC_RATE_LIMIT_TRUSTED_PROXIES"] || "1",
);
export const RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ADDRESS =
  Number(process.env["RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ADDRESS"]) || 20;
export const RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ACCOUNT =
  Number(process.env["RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ACCOUNT"]) || 10;
export const RBAC_RATE_LIMIT_SESSION_ATTEMPTS_PER_ADDRESS =
  Number(process.env["RBAC_RATE_LIMIT_SESSION_ATTEMPTS_PER_ADDRESS"]) || 60;
export const RBAC_RATE_LIMIT_OPERATOR_SECRET_FAILURES_PER_ADDRESS =
  Number(process.env["RBAC_RATE_LIMIT_OPERATOR_SECRET_FAILURES_PER_ADDRESS"]) ||
  10;
