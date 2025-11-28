import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";
import { OpenAI, ZAI } from "@sps/shared-third-parties";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api as socialModuleProfilesToMessagesApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";

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

      const socialModuleMessageId = c.req.param("socialModuleMessageId");

      if (!socialModuleMessageId) {
        throw new Error("Validation error. No socialModuleMessageId provided");
      }

      const socialModuleSendMessageProfilesToMessages =
        await socialModuleProfilesToMessagesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "messageId",
                  method: "eq",
                  value: socialModuleMessageId,
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

      if (!socialModuleSendMessageProfilesToMessages?.length) {
        throw new Error(
          "Validation error. No socialModuleSendMessageProfile found",
        );
      }

      const sendMessageIsTheSameSubjectAsReacting =
        await subjectsToSocialModuleProfilesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "socialModuleProfileId",
                  method: "inArray",
                  value: socialModuleSendMessageProfilesToMessages.map(
                    (entity) => {
                      return entity.profileId;
                    },
                  ),
                },
                {
                  column: "subjectId",
                  method: "eq",
                  value: id,
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

      if (
        socialModuleProfile.variant !== "artificial-intelligence" ||
        sendMessageIsTheSameSubjectAsReacting?.length
      ) {
        return c.json({
          data: null,
        });
      }

      const socialModuleMessage = await socialModuleMessageApi.findById({
        id: socialModuleMessageId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleMessage?.description) {
        throw new Error(
          "Not found. Social module message description not found",
        );
      }

      const socialModuleChatToMessages =
        await socialModuleChatsToMessagesApi.find({
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
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

      const context: {
        role: "user" | "assistant";
        content: string;
      }[] = [
        {
          role: "user",
          content:
            "Reply in HTML, that can be send to Telegram. Parse mode: HTML",
        },
      ];

      if (socialModuleChatToMessages?.length) {
        const socialModuleMessages = await socialModuleMessageApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: socialModuleChatToMessages.map(
                    (socialModuleChatToMessage) =>
                      socialModuleChatToMessage.messageId,
                  ),
                },
              ],
            },
            orderBy: {
              and: [
                {
                  column: "createdAt",
                  method: "asc",
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

        if (socialModuleMessages?.length) {
          const socialModuleProfilesToMessages =
            await socialModuleProfilesToMessagesApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "messageId",
                      method: "inArray",
                      value: socialModuleMessages.map(
                        (socialModuleChatToMessage) =>
                          socialModuleChatToMessage.id,
                      ),
                    },
                  ],
                },
                orderBy: {
                  and: [
                    {
                      column: "createdAt",
                      method: "asc",
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

          if (socialModuleProfilesToMessages?.length) {
            for (const socialModuleMessage of socialModuleMessages) {
              const isAssistantMessage = socialModuleProfilesToMessages.find(
                (socialModuleProfileToMessage) =>
                  socialModuleProfileToMessage.messageId ===
                    socialModuleMessage.id &&
                  socialModuleProfileToMessage.profileId ===
                    socialModuleProfileId,
              );

              context.push({
                role: isAssistantMessage ? "assistant" : "user",
                content: socialModuleMessage.description || "",
              });
            }
          }
        }
      }

      // console.log("🚀 ~ execute ~ context:", context);

      const openAI = new ZAI();
      const text = await openAI.generateText({ context });

      // console.log("🚀 ~ execute ~ text:", text);

      const message =
        await api.socialModuleProfileFindByIdChatFindByIdMessageCreate({
          id,
          socialModuleProfileId,
          socialModuleChatId,
          data: {
            description: text,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      return c.json({
        data: message,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
