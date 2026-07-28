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

      const rbacSubjectRelations =
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

      if (
        rbacSubjectRelations?.length !== 1 ||
        !rbacSubjectRelations[0]?.subjectId
      ) {
        throw new Error(
          "Validation error. social.profile must have exactly one linked rbac.subject.",
        );
      }

      const rbacSubject = await this.service.findById({
        id: rbacSubjectRelations[0].subjectId,
      });

      if (!rbacSubject) {
        throw new Error("Not found error. Linked rbac.subject not found");
      }

      const issuedAt = Math.floor(Date.now() / 1000);
      const rbacSubjectAuthenticationJwt = await jwt.sign(
        {
          exp: issuedAt + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: issuedAt,
          subject: rbacSubject,
        },
        RBAC_JWT_SECRET,
      );
      const catalogSession =
        await this.service.socialModuleProfileMcpCatalogOpen({
          configuredServerIds: Array.isArray(
            socialModuleProfile.allowedMcpServerIds,
          )
            ? socialModuleProfile.allowedMcpServerIds.filter(
                (identifier): identifier is string =>
                  typeof identifier === "string",
              )
            : [],
          rbacSubjectAuthenticationJwt,
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
