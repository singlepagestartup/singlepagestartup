import { RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS } from "@sps/shared-utils";
import { CookieOptions } from "hono/utils/cookie";

/**
 * The exchange code is a bearer credential: it buys a session with no further
 * proof. It travels in this cookie instead of the redirect query string, so it
 * stays out of browser history, out of `Referer` and out of proxy logs.
 */
export const exchangeCodeCookieName = "rbac.oauth.exchange-code";

export const exchangeCodeCookieOptions: CookieOptions = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "Lax",
  maxAge: RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS,
};
