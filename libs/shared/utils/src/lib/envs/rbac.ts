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
