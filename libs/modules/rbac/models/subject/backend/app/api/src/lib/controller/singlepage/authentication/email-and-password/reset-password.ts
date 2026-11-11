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
      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return next();
      }

      const data = JSON.parse(body["data"]);

      if (typeof data.code !== "string" || !data.code) {
        throw new Error("Validation error. No code provided");
      }

      if (typeof data.password !== "string" || data.password.length < 8) {
        throw new Error(
          "Validation error. Use at least eight characters for your password.",
        );
      }

      if (data.password !== data.passwordConfirmation) {
        throw new Error("Validation error. Passwords do not match");
      }

      await this.service.identity.resetPassword({
        code: data.code,
        password: data.password,
      });

      return c.json(
        {
          data: {
            ok: true,
          },
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
