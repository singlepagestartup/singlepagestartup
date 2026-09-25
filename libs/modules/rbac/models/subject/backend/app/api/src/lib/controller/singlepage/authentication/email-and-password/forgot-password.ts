import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import bcrypt from "bcrypt";
import { getHttpErrorType } from "@sps/backend-utils";

/**
 * The answer to every request, whether or not a reset code was stored
 * (issue #310), so the response does not tell whether an address has an
 * account.
 */
const ACCEPTED = {
  data: {
    ok: true,
  },
};

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

      const identities = await this.service.identity.find({
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

      // A reset code is stored only for exactly one identity linked to a
      // subject; every other address gets the same answer.
      if (identities?.length !== 1) {
        return c.json(ACCEPTED, 201);
      }

      const subjectsToIdentities = await this.service.subjectsToIdentities.find(
        {
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
        },
      );

      if (!subjectsToIdentities?.length) {
        return c.json(ACCEPTED, 201);
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
        },
      });

      if (!identity) {
        throw new Error("Not Found error. Could not update identity");
      }

      // await api.notify({
      //   id: subjectsToIdentities[0].subjectId,
      //   data: {
      //     notification: {
      //       notification: {
      //         method: "email",
      //         data: {
      //           rbac: {
      //             identity,
      //           },
      //         }
      //       },
      //       template: {
      //         variant: "reset-password",
      //       },
      //       topic: {
      //         slug: "security",
      //       },
      //     },
      //   },
      //   options: {
      //     headers: {
      //       "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      //     },
      //   },
      // });

      return c.json(ACCEPTED, 201);
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
