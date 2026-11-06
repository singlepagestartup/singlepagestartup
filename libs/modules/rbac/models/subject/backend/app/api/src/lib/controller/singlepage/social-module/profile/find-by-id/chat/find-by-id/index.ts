import { withConsistencySnapshot } from "@sps/shared-backend-api";
import type { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service as Presentations } from "../../../../../../../service/singlepage/social-module/chat/presentations";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      return await withConsistencySnapshot(async () => {
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
          throw new Error(
            "Validation error. No socialModuleProfileId provided",
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

        const socialModuleChatId = c.req.param("socialModuleChatId");

        if (!socialModuleChatId) {
          throw new Error("Validation error. No socialModuleChatId provided");
        }

        if (await this.isSubjectAdmin(id)) {
          const socialModuleChat =
            await this.service.socialModule.chat.findById({
              id: socialModuleChatId,
            });

          if (!socialModuleChat) {
            throw new Error(
              "Not found error. Requested social-module chat not found",
            );
          }

          return this.response(c, socialModuleChat);
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
            "Permission error. Requested profile cannot access this chat",
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

        return this.response(c, socialModuleChat);
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  protected async response(
    c: Context,
    chat: ISocialModuleChat,
  ): Promise<Response> {
    const participants =
      c.req.query("includeParticipants") === "true"
        ? await this.service.socialModuleChatParticipants({
            socialModuleChatId: chat.id,
          })
        : undefined;
    const participantPresentations = participants
      ? [
          ...(
            await new Presentations(this.service).find(
              participants.map((profile) => profile.id),
            )
          ).values(),
        ]
      : undefined;
    return c.json({
      data: participants
        ? { ...chat, participants, participantPresentations }
        : chat,
    });
  }

  protected async isSubjectAdmin(subjectId: string): Promise<boolean> {
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
