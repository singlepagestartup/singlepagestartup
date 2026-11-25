import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { Middleware as RbacModuleRequestSubjectIsOwnerMiddleware } from "../request-subject-is-owner";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export interface IMiddlewareGeneric {
  requireJwt?: boolean;
  personalProfileOnly?: boolean;
  activeSubjectId?: (token: string) => Promise<string | undefined | null>;
}

export class Middleware {
  init(options?: IMiddlewareGeneric): MiddlewareHandler<any, any, {}> {
    const checkOwner = new RbacModuleRequestSubjectIsOwnerMiddleware().init(
      options,
    );
    return createMiddleware(async (c, next) => {
      await checkOwner(c, async () => {
        try {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          const id = c.req.param("id");

          if (!id) {
            throw new Error("Validation error. No id provided");
          }

          const socialModuleProfileId = c.req.param("socialModuleProfileId");

          if (!socialModuleProfileId) {
            throw new Error(
              "Validation error. No socialModuleProfileId provided",
            );
          }

          const subjectsToSocialModuleProfiles =
            await subjectsToSocialModuleProfilesApi.find({
              params: {
                filters: {
                  and: [
                    ...(!options?.personalProfileOnly
                      ? [
                          {
                            column: "subjectId",
                            method: "eq" as const,
                            value: id,
                          },
                        ]
                      : []),
                    {
                      column: "socialModuleProfileId",
                      method: "eq",
                      value: socialModuleProfileId,
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

          if (!subjectsToSocialModuleProfiles?.length) {
            throw new Error(
              "Not found error. Requested subjects-to-social-module-profiles not found",
            );
          }

          if (subjectsToSocialModuleProfiles.length > 1) {
            throw new Error(
              "Validation error. Requested subjects-to-social-module-profiles have more than 1 entity",
            );
          }

          const socialModuleProfile = await socialModuleProfileApi.findById({
            id: socialModuleProfileId,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          if (!socialModuleProfile) {
            throw new Error(
              "Not found error. Requested social-module profile not found",
            );
          }

          if (
            options?.personalProfileOnly &&
            (subjectsToSocialModuleProfiles[0].subjectId !== id ||
              subjectsToSocialModuleProfiles[0].variant !== "default" ||
              !["default", "telegram"].includes(socialModuleProfile.variant))
          ) {
            throw new Error("Not found error. Personal profile is unavailable");
          }
          return next();
        } catch (error: any) {
          const { status, message, details } = getHttpErrorType(error);
          throw new HTTPException(status, { message, cause: details });
        }
      });
    });
  }
}
