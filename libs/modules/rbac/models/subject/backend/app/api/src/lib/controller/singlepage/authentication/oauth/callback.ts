import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { setCookie } from "hono/cookie";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { exchangeCodeCookieName, exchangeCodeCookieOptions } from "./cookie";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const provider = c.req.param("provider");

      if (!provider) {
        throw new Error("Validation error. OAuth provider is required");
      }

      const entity = await this.service.authenticationOAuthCallback({
        provider,
        state: c.req.query("state"),
        code: c.req.query("code"),
        error: c.req.query("error"),
        errorDescription:
          c.req.query("error_description") || c.req.query("errorDescription"),
      });

      if (entity.exchangeCode) {
        setCookie(
          c,
          exchangeCodeCookieName,
          entity.exchangeCode,
          exchangeCodeCookieOptions,
        );
      }

      // Neither the exchange code nor the built URL is a field here: the URL
      // is what used to carry the code into the log.
      logger.info("oauth/callback handled", {
        provider,
        state: c.req.query("state"),
        hasCode: Boolean(c.req.query("code")),
        error: c.req.query("error"),
        redirectPath: entity.redirectPath,
      });

      return c.redirect(entity.redirectUrl, 302);
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
