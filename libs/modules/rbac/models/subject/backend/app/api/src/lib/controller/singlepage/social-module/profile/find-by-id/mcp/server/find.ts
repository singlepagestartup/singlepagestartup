import { getHttpErrorType } from "@sps/backend-utils";
import {
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { Service } from "../../../../../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: unknown): Promise<Response> {
    try {
      const socialModuleProfileId = c.req.param("socialModuleProfileId");

      if (!socialModuleProfileId) {
        throw new Error("Validation error. No socialModuleProfileId provided");
      }

      const socialModuleProfile =
        await this.service.socialModule.profile.findById({
          id: socialModuleProfileId,
        });

      if (!socialModuleProfile) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      const employeeRelations =
        await this.service.subjectsToSocialModuleProfiles.find({
          params: {
            filters: {
              and: [
                {
                  column: "socialModuleProfileId",
                  method: "eq",
                  value: socialModuleProfileId,
                },
              ],
            },
          },
        });

      if (employeeRelations?.length !== 1 || !employeeRelations[0]?.subjectId) {
        throw new Error(
          "Validation error. Profile must have exactly one employee subject.",
        );
      }

      const employeeSubject = await this.service.findById({
        id: employeeRelations[0].subjectId,
      });

      if (!employeeSubject) {
        throw new Error("Not found error. Employee subject not found");
      }

      const issuedAt = Math.floor(Date.now() / 1000);
      const employeeSpsJwt = await jwt.sign(
        {
          exp: issuedAt + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: issuedAt,
          subject: employeeSubject,
        },
        RBAC_JWT_SECRET,
      );
      const catalogSession = await this.service.openProfileMcpCatalog({
        configuredServerIds: Array.isArray(
          socialModuleProfile.allowedMcpServerIds,
        )
          ? socialModuleProfile.allowedMcpServerIds.filter(
              (identifier): identifier is string =>
                typeof identifier === "string",
            )
          : [],
        employeeSpsJwt,
      });

      try {
        return c.json({ data: catalogSession.catalog });
      } finally {
        await catalogSession.close();
      }
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
