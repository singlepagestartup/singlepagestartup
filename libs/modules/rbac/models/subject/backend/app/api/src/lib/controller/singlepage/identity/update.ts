import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../service";
import { applyOutputSchema } from "@sps/shared-backend-api";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const identityUuid = c.req.param("identityUuid");
      if (!identityUuid)
        throw new Error("Validation error. Identity is required");

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);
      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        Object.keys(data).some(
          (key) => !["email", "password", "newPassword"].includes(key),
        )
      )
        throw new Error(
          "Validation error. Only email or password may be updated",
        );

      const identity = await this.service.identity.findById({
        id: identityUuid,
      });

      if (!identity) {
        throw new Error("Not Found error. No identity found");
      }

      if (identity.provider !== "email_and_password")
        throw new Error(
          "Validation error. This sign-in provider manages its own credentials",
        );
      if (data.password !== undefined || data.newPassword !== undefined) {
        if (
          typeof data.password !== "string" ||
          typeof data.newPassword !== "string" ||
          data.newPassword.length < 8 ||
          data.email !== undefined
        )
          throw new Error(
            "Validation error. Current and new passwords are required",
          );
        await this.service.identity.changePassword({
          id: identity.id,
          data: {
            password: data.password,
            newPassword: data.newPassword,
          },
        });
      } else {
        throw new Error(
          "Validation error. Verify your current and new email before changing it.",
        );
      }
      const updated = await this.service.identity.findById({
        id: identityUuid,
      });

      return c.json(
        {
          data: applyOutputSchema({
            c,
            service: this.service.identity,
            data: updated,
          }),
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
