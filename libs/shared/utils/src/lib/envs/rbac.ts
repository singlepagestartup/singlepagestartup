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
 * How long a wallet login challenge stays redeemable. It is also the upper
 * bound on the age of the `Issued At` a signed message may carry, so a short
 * value is what keeps a captured signature from being useful later.
 */
export const RBAC_EVM_NONCE_LIFETIME_IN_SECONDS =
  Number(process.env["RBAC_EVM_NONCE_LIFETIME_IN_SECONDS"]) || 120;
/**
 * How far ahead of the server a wallet's clock may be. The default is 0: a
 * message dated in the future is refused, which is the direction the previous
 * check missed entirely. Raise it only for a deployment that has measured the
 * skew it needs.
 */
export const RBAC_EVM_MAX_CLOCK_SKEW_IN_SECONDS =
  Number(process.env["RBAC_EVM_MAX_CLOCK_SKEW_IN_SECONDS"]) || 0;
/**
 * Compatibility knob for one release. Wallet login now signs an EIP-4361
 * message the server issued; a project whose own wallet variant still signs a
 * bare millisecond timestamp sets this to `true` until that variant is
 * updated. The future-dated rejection applies on the legacy path too, so the
 * flag restores the old message format and not the old freshness rule.
 */
export const RBAC_EVM_LEGACY_TIMESTAMP_MESSAGE =
  process.env["RBAC_EVM_LEGACY_TIMESTAMP_MESSAGE"] === "true";
/**
 * The RPC endpoint signature verification may call. Empty keeps viem's chain
 * default, which is a single public endpoint; a deployment that does not want
 * an anonymous route reaching a third party points this at its own node.
 */
export const RBAC_EVM_RPC_URL = process.env["RBAC_EVM_RPC_URL"] || "";
/**
 * Deadline for that call. Verification falls back to local recovery when the
 * contract check fails, so the timeout bounds how long an anonymous request
 * can hold a connection open on a slow RPC.
 */
export const RBAC_EVM_RPC_TIMEOUT_IN_MILLISECONDS =
  Number(process.env["RBAC_EVM_RPC_TIMEOUT_IN_MILLISECONDS"]) || 5000;
