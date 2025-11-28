import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { Service } from "../../../../service";
import bcrypt from "bcrypt";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET not set");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return next();
      }

      const data = JSON.parse(body["data"]);

      if (!data.code) {
        throw new Error("Validation error. No code provided");
      }

      const identities = await identityApi.find({
        params: {
          filters: {
            and: [
              {
                column: "code",
                method: "eq",
                value: data.code,
              },
              {
                column: "provider",
                method: "eq",
                value: "email_and_password",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!identities?.length) {
        throw new Error("Not Found error. No identities found");
      }

      const identity = identities[0];

      const updatedAt = new Date(identity.updatedAt).getTime();

      const codeExpired = new Date().getTime() - updatedAt < 3600000;

      if (!codeExpired) {
        throw new Error("Validation error. Code is expired. Resend again.");
      }

      if (!data.password) {
        throw new Error("Validation error. No password provided");
      }

      if (data.password !== data.passwordConfirmation) {
        throw new Error("Validation error. Passwords do not match");
      }

      if (!identity.salt) {
        throw new Error("Validation error. No salt found for this identity");
      }

      await identityApi.update({
        id: identity.id,
        data: {
          ...identity,
          code: null,
          password: await bcrypt.hash(data.password, identity.salt),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
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
