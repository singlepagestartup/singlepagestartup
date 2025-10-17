import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../service";
import { api as socialModuleProfilesToMessagesApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleProfilesApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
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

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      const socialMouleMessage = await socialModuleMessageApi.create({
        data: {
          description: data.description,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await socialModuleChatsToMessagesApi.create({
        data: {
          messageId: socialMouleMessage.id,
          chatId: socialModuleChatId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await this.notifyOtherSubjectsInChat({
        socialModuleChatId,
        socialModuleMessageId: socialMouleMessage.id,
        profileId: socialModuleProfileId,
      });

      await socialModuleProfilesToMessagesApi.create({
        data: {
          messageId: socialMouleMessage.id,
          profileId: socialModuleProfileId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: socialMouleMessage,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  async notifyOtherSubjectsInChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
    profileId: string;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const socialModuleProfilesToChats =
      await socialModuleProfilesToChatsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
              {
                column: "profileId",
                method: "ne",
                value: props.profileId,
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

    if (!socialModuleProfilesToChats?.length) {
      return;
    }

    const subjectsToSocialModuleProfiles =
      await subjectsToSocialModuleProfilesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "inArray",
                value: socialModuleProfilesToChats.map(
                  (profileToChat) => profileToChat.profileId,
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
      });

    if (!subjectsToSocialModuleProfiles?.length) {
      return;
    }

    const socialModuleProfiles = await socialModuleProfilesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: socialModuleProfilesToChats.map(
                (profileToChat) => profileToChat.profileId,
              ),
            },
            {
              column: "variant",
              method: "eq",
              value: "artificial-intelligence",
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

    if (!socialModuleProfiles?.length) {
      return;
    }

    const filteredSubjectsToSocialModuleProfiles =
      subjectsToSocialModuleProfiles.filter((subjectToSocialModuleProfile) =>
        socialModuleProfiles.some(
          (profile) =>
            profile.id === subjectToSocialModuleProfile.socialModuleProfileId,
        ),
      );

    const subjects = await api.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: filteredSubjectsToSocialModuleProfiles.map(
                (subjectToSocialModuleProfile) =>
                  subjectToSocialModuleProfile.subjectId,
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
    });

    if (subjects?.length) {
      for (const subject of subjects) {
        const subjectToSocialModuleProfile =
          subjectsToSocialModuleProfiles.find(
            (subjectToSocialModuleProfile) =>
              subjectToSocialModuleProfile.subjectId === subject.id,
          );

        if (!subjectToSocialModuleProfile) {
          continue;
        }

        await api.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReact({
          id: subject.id,
          socialModuleProfileId:
            subjectToSocialModuleProfile.socialModuleProfileId,
          socialModuleChatId: props.socialModuleChatId,
          socialModuleMessageId: props.socialModuleMessageId,
          data: {},
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }
  }
}
