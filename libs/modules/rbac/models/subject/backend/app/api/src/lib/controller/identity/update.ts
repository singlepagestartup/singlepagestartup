import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/sps-backend-utils";
import { Service } from "../../service";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    const uuid = c.req.param("uuid");
    const identityUuid = c.req.param("identityUuid");

    if (decoded?.["subject"]?.["id"] !== uuid) {
      throw new HTTPException(403, {
        message: "Only identity owner can update identity.",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new HTTPException(400, {
        message: "Invalid body",
      });
    }

    const data = JSON.parse(body["data"]);

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: uuid,
            },
            {
              column: "identityId",
              method: "eq",
              value: identityUuid,
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

    if (!subjectsToIdentities?.length) {
      throw new HTTPException(404, {
        message: "No subjects to identities found",
      });
    }

    if (subjectsToIdentities.length > 1) {
      throw new HTTPException(400, {
        message: "Multiple subjects to identities found",
      });
    }

    try {
      const identity = await identityApi.findById({
        id: identityUuid,
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
        throw new HTTPException(404, {
          message: "No identity found",
        });
      }

      if (identity.provider === "login_and_password") {
        if (data.password && data.newPassword) {
          const updated = await identityApi.changePassword({
            id: identity.id,
            data: {
              password: data.password,
              newPassword: data.newPassword,
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
        } else {
          const updated = await identityApi.update({
            id: identity.id,
            data: {
              ...identity,
              ...data,
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
        }
      }

      return c.json(
        {
          data,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }
}
