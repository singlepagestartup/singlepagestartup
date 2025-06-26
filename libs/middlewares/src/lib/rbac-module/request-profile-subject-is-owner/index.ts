import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { authorization } from "@sps/backend-utils";
import * as jwt from "hono/jwt";
import { Middleware as RbacModuleRequestSubjectIsOwnerMiddleware } from "../request-subject-is-owner";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";

export interface IMiddlewareGeneric {}

export class Middleware {
  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const rbacModuleRequestSubjectIsOwnerMiddleware =
        new RbacModuleRequestSubjectIsOwnerMiddleware();

      await rbacModuleRequestSubjectIsOwnerMiddleware.init()(c, async () => {
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
                    {
                      column: "subjectId",
                      method: "eq",
                      value: id,
                    },
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
              },
            },
          });

          if (!socialModuleProfile) {
            throw new Error(
              "Not found error. Requested social-module profile not found",
            );
          }

          return next();
        } catch (error: any) {
          if (error.message?.includes("Configuration error")) {
            throw new HTTPException(500, {
              message: error.message || "Configuration error",
              cause: error,
            });
          }

          if (error.message?.includes("Validation error")) {
            throw new HTTPException(400, {
              message: error.message || "Validation error",
              cause: error,
            });
          }

          if (error.message?.includes("Unauthorized")) {
            throw new HTTPException(403, {
              message: error.message || "Unauthorized",
              cause: error,
            });
          }

          if (error.message?.includes("Not found")) {
            throw new HTTPException(404, {
              message: error.message || "Not found",
              cause: error,
            });
          }

          throw new HTTPException(500, {
            message: error.message || "Internal Server Error",
            cause: error,
          });
        }
      });
    });
  }
}
