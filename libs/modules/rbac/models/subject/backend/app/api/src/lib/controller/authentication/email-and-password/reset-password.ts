import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { Service } from "../../../service";
import bcrypt from "bcrypt";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET not set",
        });
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return next();
      }

      const data = JSON.parse(body["data"]);

      if (!data.code) {
        throw new HTTPException(400, {
          message: "No code provided",
        });
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
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!identities?.length) {
        throw new HTTPException(404, {
          message: "No identities found",
        });
      }

      const identity = identities[0];

      const updatedAt = new Date(identity.updatedAt).getTime();

      const codeExpired = new Date().getTime() - updatedAt < 3600000;

      if (!codeExpired) {
        throw new HTTPException(400, {
          message: "Code is expired. Resend again.",
        });
      }

      if (!data.password) {
        throw new HTTPException(400, {
          message: "No password provided",
        });
      }

      if (data.password !== data.passwordConfirmation) {
        throw new HTTPException(400, {
          message: "Passwords do not match",
        });
      }

      if (!identity.salt) {
        throw new HTTPException(400, {
          message: "No salt found for this identity",
        });
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
          next: {
            cache: "no-store",
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
      throw new HTTPException(500, {
        message: error.message || "Internal server error",
        cause: error,
      });
    }
  }
}
