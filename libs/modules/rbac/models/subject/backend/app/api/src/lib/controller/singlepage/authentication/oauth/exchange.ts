import {
  RBAC_JWT_ALGORITHM,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { Service } from "../../../../service";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { getHttpErrorType } from "@sps/backend-utils";
import { exchangeCodeCookieName } from "./cookie";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
        throw new Error(
          "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
        );
      }

      const code = await this.getExchangeCode(c);

      if (!code) {
        throw new Error("Validation error. OAuth exchange code is required");
      }

      let entity: Awaited<ReturnType<Service["authenticationOAuthExchange"]>>;

      try {
        entity = await this.service.authenticationOAuthExchange({
          code,
        });
      } catch (error: any) {
        // The code is single use either way: a failed redemption must not
        // leave it in the browser to be replayed.
        deleteCookie(c, exchangeCodeCookieName, { path: "/" });

        throw error;
      }

      deleteCookie(c, exchangeCodeCookieName, { path: "/" });

      const decoded = await jwt.verify(
        entity.jwt,
        RBAC_JWT_SECRET,
        RBAC_JWT_ALGORITHM,
      );

      if (!decoded.exp) {
        throw new Error("Authentication error. Invalid token issued");
      }

      setCookie(c, "rbac.subject.jwt", entity.jwt, {
        path: "/",
        secure: true,
        httpOnly: false,
        maxAge: RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        expires: new Date(decoded.exp * 1000),
        sameSite: "Strict",
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  /**
   * The cookie is the supported source. The request body is read only while
   * `RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY` is on, which is the one-release escape
   * hatch for a deployment whose API and host are not on the same site.
   */
  protected async getExchangeCode(c: Context) {
    const cookieCode = getCookie(c, exchangeCodeCookieName);

    if (cookieCode) {
      return cookieCode;
    }

    if (!RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY) {
      return undefined;
    }

    const body = (await c.req.parseBody().catch(() => ({}))) as Record<
      string,
      string | File
    >;

    if (typeof body["data"] !== "string") {
      return undefined;
    }

    const data = JSON.parse(body["data"]);

    if (!data.code || typeof data.code !== "string") {
      return undefined;
    }

    return data.code;
  }
}
