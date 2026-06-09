import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { IModel as ISocialModuleProfileToChat } from "@sps/social/relations/profiles-to-chats/sdk/model";

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

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      const socialModuleProfileId = c.req.param("socialModuleProfileId");

      if (!socialModuleProfileId) {
        throw new Error("Validation error. No socialModuleProfileId provided");
      }

      await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
        subjectId: id,
        socialModuleChatId,
      });

      const allSocialModuleProfilesToChats =
        await this.service.socialModule.profilesToChats.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: socialModuleChatId,
                },
              ],
            },
          },
        });

      if (!allSocialModuleProfilesToChats?.length) {
        throw new Error(
          "Not found error. Requested social-module chat members not found",
        );
      }

      const uniqueProfileIds = new Set(
        allSocialModuleProfilesToChats.map((relation) => {
          return relation.profileId;
        }),
      );

      if (uniqueProfileIds.size <= 1) {
        throw new Error(
          "Validation error. Cannot remove the last profile from a chat",
        );
      }

      const relationsToDelete = allSocialModuleProfilesToChats.filter(
        (relation) => {
          return relation.profileId === socialModuleProfileId;
        },
      );

      if (!relationsToDelete.length) {
        throw new Error(
          "Not found error. Requested social-module chat member not found",
        );
      }

      const deletedRelations: ISocialModuleProfileToChat[] = [];

      for (const relationToDelete of relationsToDelete) {
        const deletedRelation = await socialModuleProfilesToChatsApi.delete({
          id: relationToDelete.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        deletedRelations.push(deletedRelation);
      }

      return c.json({
        data: deletedRelations,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
