import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../service";
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

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      if (await this.isSubjectAdmin(id)) {
        const socialModuleChat = await this.service.socialModule.chat.findById({
          id: socialModuleChatId,
        });

        if (!socialModuleChat) {
          throw new Error(
            "Not found error. Requested social-module chat not found",
          );
        }

        return c.json({
          data: socialModuleChat,
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
                {
                  column: "chatId",
                  method: "eq",
                  value: socialModuleChatId,
                },
              ],
            },
          },
        });

      if (!socialModuleProfilesToChats?.length) {
        throw new Error(
          "Not found error. Requested social-module chat not found",
        );
      }

      const socialModuleChat = await this.service.socialModule.chat.findById({
        id: socialModuleChatId,
      });

      if (!socialModuleChat) {
        throw new Error(
          "Not found error. Requested social-module chat not found",
        );
      }

      return c.json({
        data: socialModuleChat,
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
