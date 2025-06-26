import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../service";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { IModel as ISocialModuleProfilesToChats } from "@sps/social/relations/profiles-to-chats/sdk/model";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";

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

      const entity = await this.service.findById({
        id,
      });

      if (!entity) {
        throw new Error("Not found error. Requested entity not found");
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

      const socialModuleProfilesToChats =
        await socialModuleProfilesToChatsApi.find({
          params: {
            filers: {
              and: [
                {
                  column: "profileId",
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

      const extendedSocialModuleProfilesToChats: (ISocialModuleProfilesToChats & {
        chats: ISocialModuleChat[];
      })[] = [];

      if (socialModuleProfilesToChats?.length) {
        await socialModuleChatApi
          .find({
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
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          })
          .then((data) => {
            if (data?.length) {
              data.forEach((socialModuleChat) => {
                const extendedSocialModuleProfileToChat =
                  extendedSocialModuleProfilesToChats?.find(
                    (socialModuleProfileToChat) => {
                      return (
                        socialModuleProfileToChat.chatId === socialModuleChat.id
                      );
                    },
                  );

                if (extendedSocialModuleProfileToChat) {
                  extendedSocialModuleProfilesToChats.push({
                    ...extendedSocialModuleProfileToChat,
                    chats: [
                      ...(extendedSocialModuleProfileToChat?.chats || []),
                      socialModuleChat,
                    ],
                  });
                } else {
                  const socialModuleProfileToChat =
                    socialModuleProfilesToChats?.find(
                      (socialModuleProfileToChat) => {
                        return (
                          socialModuleProfileToChat.chatId ===
                          socialModuleChat.id
                        );
                      },
                    );

                  if (socialModuleProfileToChat) {
                    extendedSocialModuleProfilesToChats.push({
                      ...socialModuleProfileToChat,
                      chats: [socialModuleChat],
                    });
                  }
                }
              });
            }
          });
      }

      return c.json({
        data: {
          ...entity,
          subjectsToSocialModuleProfiles: [
            {
              ...subjectsToSocialModuleProfiles[0],
              socialModuleProfile: {
                ...socialModuleProfile,
                profilesToChats: extendedSocialModuleProfilesToChats,
              },
            },
          ],
        },
      });
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
  }
}
