import {
  RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as rbacModuleSubjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as rbacModuleSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      if (!RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS) {
        throw new Error(
          "Configuration error. RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS not set",
        );
      }

      logger.info("Rbac module subject delete anonymous started");

      const oldSubjects = await rbacModuleSubjectApi.find({
        params: {
          filters: {
            and: [
              {
                column: "createdAt",
                method: "lt",
                value: new Date(
                  Date.now() -
                    RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS * 1000,
                ).toISOString(),
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const subjectsToIdentities = await rbacModuleSubjectsToIdentitiesApi.find(
        {
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        },
      );

      const subjectsToSocialModuleProfiles =
        await rbacModuleSubjectsToSocialModuleProfilesApi.find({
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      if (!oldSubjects?.length) {
        return c.json({ data: { ok: true } });
      }

      const expiredSubjects = oldSubjects
        .filter((subject) => {
          const subjectToIdentities = subjectsToIdentities?.find(
            (subjectToIdentity) => subjectToIdentity.subjectId === subject.id,
          );

          if (!subjectToIdentities) {
            return true;
          }

          return false;
        })
        .filter((subject) => {
          if (!subjectsToSocialModuleProfiles?.length) {
            return true;
          }

          const subjectToSocialModuleProfiles =
            subjectsToSocialModuleProfiles?.filter(
              (subjectToSocialModuleProfile) =>
                subjectToSocialModuleProfile.subjectId === subject.id,
            );

          if (!subjectToSocialModuleProfiles.length) {
            return true;
          }

          return false;
        });

      if (expiredSubjects?.length) {
        for (const expiredSubject of expiredSubjects) {
          try {
            await rbacModuleSubjectApi.delete({
              id: expiredSubject.id,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          } catch (error: any) {
            // logger.error("Billing module payment intent check failed", {
            //   error: error,
            // });
          }
        }
      }

      logger.info("Rbac module subject delete anonymous finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }
}
