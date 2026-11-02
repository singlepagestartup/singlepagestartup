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
