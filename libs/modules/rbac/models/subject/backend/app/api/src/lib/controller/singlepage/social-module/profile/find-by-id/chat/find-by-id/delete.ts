import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import { api as socialModuleActionApi } from "@sps/social/models/action/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  private uniqueValues(values: (string | undefined | null)[]) {
    return Array.from(
      new Set(
        values.filter((value): value is string => {
          return Boolean(value);
        }),
      ),
    );
  }

  private async cleanupChatRecords(props: { socialModuleChatId: string }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const headers = {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
    };
    const socialModuleChatsToThreads =
      await this.service.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });
    const socialModuleChatsToMessages =
      await this.service.socialModule.chatsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });
    const socialModuleChatsToActions =
      await this.service.socialModule.chatsToActions.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });
    const socialModuleThreadIds = this.uniqueValues(
      socialModuleChatsToThreads?.map((relation: any) => {
        return relation.threadId;
      }) || [],
    );
    const socialModuleMessageIds = this.uniqueValues(
      socialModuleChatsToMessages?.map((relation: any) => {
        return relation.messageId;
      }) || [],
    );
    const socialModuleActionIds = this.uniqueValues(
      socialModuleChatsToActions?.map((relation: any) => {
        return relation.actionId;
      }) || [],
    );

    for (const socialModuleMessageId of socialModuleMessageIds) {
      const messageChatLinks =
        await this.service.socialModule.chatsToMessages.find({
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
        });
      const isLinkedOnlyToCurrentChat = (messageChatLinks || []).every(
        (messageChatLink: any) => {
          return messageChatLink.chatId === props.socialModuleChatId;
        },
      );

      if (isLinkedOnlyToCurrentChat) {
        await socialModuleMessageApi.delete({
          id: socialModuleMessageId,
          options: {
            headers,
          },
        });
      }
    }

    for (const socialModuleActionId of socialModuleActionIds) {
      const actionChatLinks =
        await this.service.socialModule.chatsToActions.find({
          params: {
            filters: {
              and: [
                {
                  column: "actionId",
                  method: "eq",
                  value: socialModuleActionId,
                },
              ],
            },
          },
        });
      const isLinkedOnlyToCurrentChat = (actionChatLinks || []).every(
        (actionChatLink: any) => {
          return actionChatLink.chatId === props.socialModuleChatId;
        },
      );

      if (isLinkedOnlyToCurrentChat) {
        await socialModuleActionApi.delete({
          id: socialModuleActionId,
          options: {
            headers,
          },
        });
      }
    }

    for (const socialModuleThreadId of socialModuleThreadIds) {
      const threadChatLinks =
        await this.service.socialModule.chatsToThreads.find({
          params: {
            filters: {
              and: [
                {
                  column: "threadId",
                  method: "eq",
                  value: socialModuleThreadId,
                },
              ],
            },
          },
        });
      const isLinkedOnlyToCurrentChat = (threadChatLinks || []).every(
        (threadChatLink: any) => {
          return threadChatLink.chatId === props.socialModuleChatId;
        },
      );

      if (isLinkedOnlyToCurrentChat) {
        await socialModuleThreadApi.delete({
          id: socialModuleThreadId,
          options: {
            headers,
          },
        });
      }
    }
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

      await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
        subjectId: id,
        socialModuleChatId,
      });

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

      await this.cleanupChatRecords({
        socialModuleChatId,
      });

      await socialModuleChatApi.delete({
        id: socialModuleChatId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: socialModuleChat,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
