import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../service";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";

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

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const token = authorization(c);

      if (!token) {
        throw new Error("Validation error. No token");
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      const uuid = c.req.param("uuid");
      const identityUuid = c.req.param("identityUuid");

      if (decoded?.["subject"]?.["id"] !== uuid) {
        throw new Error(
          "Validation error. Only identity owner can create identity.",
        );
      }

      const subjectsToAllIdentities = await subjectsToIdentitiesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: uuid,
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

      if (subjectsToAllIdentities?.length === 1) {
        throw new Error("Internal error. Cannot delete last identity");
      }

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
            "Cache-Control": "no-store",
          },
        },
      });

      if (!subjectsToIdentities?.length) {
        throw new Error("Not Found error. No subjects to identities found");
      }

      if (subjectsToIdentities.length > 1) {
        throw new Error(
          "Internal error. Multiple subjects to identities found",
        );
      }

      await subjectsToIdentitiesApi.delete({
        id: subjectsToIdentities[0].id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await identityApi.delete({
        id: identityUuid,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const entity = await api.findById({
        id: uuid,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
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
}
