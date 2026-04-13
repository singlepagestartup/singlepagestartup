import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

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

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

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

      const subjectToSocialModuleProfiles =
        await this.service.subjectsToSocialModuleProfiles.find({
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
        });

      if (!subjectToSocialModuleProfiles?.length) {
        throw new Error(
          "Authorization error. Requested social-module profile does not belong to subject",
        );
      }

      const parsedQuery = c.get("parsedQuery");
      const limit = parsedQuery?.limit || 100;
      const offset = parsedQuery?.offset || 0;
      const orderBy = parsedQuery?.orderBy;

      if (await this.isSubjectAdmin(id)) {
        const socialModuleChats = await this.service.socialModule.chat.find({
          params: {
            limit,
            offset,
            orderBy,
          },
        });

        return c.json({
          data: socialModuleChats,
        });
      }

      const socialModuleProfilesToChats =
        await this.service.socialModule.profilesToChats.find({
          params: {
            filters: {
              and: [
                {
                  column: "profileId",
                  method: "eq",
                  value: socialModuleProfileId,
                },
              ],
            },
          },
        });

      if (!socialModuleProfilesToChats?.length) {
        return c.json({
          data: [],
        });
      }

      const socialModuleChats = await this.service.socialModule.chat.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: socialModuleProfilesToChats?.map(
                  (socialModuleProfileToChat) => {
                    return socialModuleProfileToChat.chatId;
                  },
                ),
              },
            ],
          },
          orderBy,
          limit,
          offset,
        },
      });

      return c.json({
        data: socialModuleChats,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private async isSubjectAdmin(subjectId: string): Promise<boolean> {
    const subjectsToRoles = await this.service.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subjectId,
            },
          ],
        },
      },
    });

    const roleIds =
      subjectsToRoles
        ?.map((subjectToRole) => {
          return subjectToRole.roleId;
        })
        .filter((roleId): roleId is string => Boolean(roleId)) || [];

    if (!roleIds.length) {
      return false;
    }

    const roles = await this.service.role.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: roleIds,
            },
          ],
        },
      },
    });

    return Boolean(
      roles?.find((role) => {
        return role.slug === "admin";
      }),
    );
  }
}
