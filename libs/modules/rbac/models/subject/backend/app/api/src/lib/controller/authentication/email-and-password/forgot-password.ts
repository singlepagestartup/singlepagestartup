import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import bcrypt from "bcrypt";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET not set");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return next();
      }

      const data = JSON.parse(body["data"]);

      const identities = await identityApi.find({
        params: {
          filters: {
            and: [
              {
                column: "email",
                method: "eq",
                value: data.email,
              },
              {
                column: "provider",
                method: "eq",
                value: "email_and_password",
              },
            ],
          },
        },
      });

      if (!identities?.length) {
        throw new Error("No identities found");
      }

      if (identities.length > 1) {
        throw new Error("Multiple identities found");
      }

      const subjectsToIdentities = await subjectsToIdentitiesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "identityId",
                method: "eq",
                value: identities[0].id,
              },
            ],
          },
        },
      });

      if (!subjectsToIdentities?.length) {
        throw new Error("No subjects to identities found");
      }

      const code = bcrypt.genSaltSync(10).replaceAll("/", "");

      const identity = await identityApi.update({
        id: identities[0].id,
        data: {
          ...identities[0],
          code,
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

      if (!identity) {
        throw new Error("Could not update identity");
      }

      await api.notify({
        id: subjectsToIdentities[0].subjectId,
        data: {
          notification: {
            notification: {
              method: "email",
              data: JSON.stringify({
                rbac: {
                  identity,
                },
              }),
            },
            template: {
              variant: "reset-password",
            },
            topic: {
              slug: "security",
            },
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
