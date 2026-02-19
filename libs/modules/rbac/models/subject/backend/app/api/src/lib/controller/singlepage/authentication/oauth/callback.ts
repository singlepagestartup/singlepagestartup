import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

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

      console.log("oauth/callback handled", {
        provider,
        state: c.req.query("state"),
        codeExists: Boolean(c.req.query("code")),
        error: c.req.query("error"),
        redirectUrl: entity.redirectUrl,
      });

      return c.redirect(entity.redirectUrl, 302);
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
