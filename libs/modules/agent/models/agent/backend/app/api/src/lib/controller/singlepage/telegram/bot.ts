import {
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { IModel as IRbacModuleAction } from "@sps/rbac/models/action/sdk/model";
import { match } from "path-to-regexp";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api as socialModuleProfilesToChatsToApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as socialModuleProfilesToMessagesToApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as rbacModuleSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import * as jwt from "hono/jwt";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      console.log("Telegram Bot Handler triggered");

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
        throw new Error(
          "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
        );
      }

      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data: {
        rbacModuleAction: IRbacModuleAction;
      };
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      const template =
        "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profile.id]/chats/[social.chat.id]/messages".replace(
          /\[(.+?)\]/g,
          (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
        );
      const matcher = match(template, {
        decode: decodeURIComponent,
        end: true,
      });

      const result = matcher(data.rbacModuleAction.payload?.route);

      if (!result) {
        return c.json({
          data: false,
        });
      }

      if (!["POST", "PATCH"].includes(data.rbacModuleAction.payload?.method)) {
        return c.json({
          data: false,
        });
      }

      const socialModuleMessage = await socialModuleMessageApi.findById({
        id: data.rbacModuleAction.payload?.result.data.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleMessage) {
        return c.json({
          data: false,
        });
      }

      const socialModuleChatsToMessages =
        await socialModuleChatsToMessagesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "messageId",
                  method: "eq",
                  value: socialModuleMessage.id,
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

      if (!socialModuleChatsToMessages?.length) {
        return c.json({
          data: false,
        });
      }

      const socialModuleChat = await socialModuleChatApi.findById({
        id: socialModuleChatsToMessages[0].chatId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleChat) {
        return c.json({
          data: false,
        });
      }

      const socialModuleProfilesToChats =
        await socialModuleProfilesToChatsToApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: socialModuleChat.id,
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
        return c.json({
          data: false,
        });
      }

      const socialModuleProfiles = await socialModuleProfileApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: socialModuleProfilesToChats.map(
                  (entity) => entity.profileId,
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

      if (!socialModuleProfiles?.length) {
        return c.json({
          data: false,
        });
      }

      const socialModuleProfilesToMessages =
        await socialModuleProfilesToMessagesToApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "messageId",
                  method: "eq",
                  value: socialModuleMessage.id,
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

      if (!socialModuleProfilesToMessages?.length) {
        return c.json({
          data: false,
        });
      }

      const socialModuleProfileToMessage = socialModuleProfilesToMessages[0];

      const messageFromSocialModuleProfile = socialModuleProfiles.find(
        (profile) => profile.id === socialModuleProfileToMessage.profileId,
      );

      const shouldReplySocialModuleProfiles = socialModuleProfiles.filter(
        (profile) =>
          ["artificial-intelligence", "agent"].includes(profile.variant),
      );

      if (!shouldReplySocialModuleProfiles.length) {
        return c.json({
          data: false,
        });
      }

      for (const shouldReplySocialModuleProfile of shouldReplySocialModuleProfiles) {
        if (
          shouldReplySocialModuleProfile.id ===
          messageFromSocialModuleProfile?.id
        ) {
          continue;
        }

        if (shouldReplySocialModuleProfile.slug !== "telegram-bot") {
          continue;
        }

        const rbacModuleSubjectsToSocialModuleProfiles =
          await rbacModuleSubjectsToSocialModuleProfilesApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "socialModuleProfileId",
                    method: "eq",
                    value: shouldReplySocialModuleProfile.id,
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

        if (!rbacModuleSubjectsToSocialModuleProfiles?.length) {
          continue;
        }

        const rbacModuleSubject = await rbacModuleSubjectApi.findById({
          id: rbacModuleSubjectsToSocialModuleProfiles[0].subjectId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!rbacModuleSubject) {
          continue;
        }

        const jwtToken = await jwt.sign(
          {
            exp:
              Math.floor(Date.now() / 1000) +
              RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
            iat: Math.floor(Date.now() / 1000),
            subject: rbacModuleSubject,
          },
          RBAC_JWT_SECRET,
        );

        rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
          {
            id: rbacModuleSubject.id,
            socialModuleProfileId: shouldReplySocialModuleProfile.id,
            socialModuleChatId: socialModuleChat.id,
            data: {
              description: `Reply to message ID: ${socialModuleMessage.id} from profile ID: ${messageFromSocialModuleProfile?.id}`,
            },
            options: {
              headers: {
                Authorization: "Bearer " + jwtToken,
              },
            },
          },
        );

        console.log(
          "🚀 ~ execute ~ shouldReplySocialModuleProfile:",
          shouldReplySocialModuleProfile,
        );
      }

      console.log("Telegram Bot Data:", data);

      return c.json({
        data: true,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }
}
