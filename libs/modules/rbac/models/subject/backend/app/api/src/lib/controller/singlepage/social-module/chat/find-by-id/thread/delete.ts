import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";
import { api as socialModuleChatsToThreadsApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import {
  canMirrorTelegramTopic,
  deleteTelegramForumTopic,
} from "./telegram-topic";

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

  private getRequiredSecretKey(): string {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    return RBAC_SECRET_KEY;
  }

  private async cleanupThreadMessages(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
    headers: Record<string, string>;
  }) {
    const socialModuleThreadsToMessages =
      await this.service.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "eq",
                value: props.socialModuleThreadId,
              },
            ],
          },
        },
      });
    const socialModuleMessageIds = this.uniqueValues(
      socialModuleThreadsToMessages?.map((relation: any) => {
        return relation.messageId;
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
      const messageThreadLinks =
        await this.service.socialModule.threadsToMessages.find({
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
      const isLinkedOnlyToCurrentThread = (messageThreadLinks || []).every(
        (messageThreadLink: any) => {
          return messageThreadLink.threadId === props.socialModuleThreadId;
        },
      );

      if (isLinkedOnlyToCurrentChat && isLinkedOnlyToCurrentThread) {
        await socialModuleMessageApi.delete({
          id: socialModuleMessageId,
          options: {
            headers: props.headers,
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

      const secretKey = this.getRequiredSecretKey();
      const headers = {
        "X-RBAC-SECRET-KEY": secretKey,
      };

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      const socialModuleThreadId = c.req.param("socialModuleThreadId");

      if (!socialModuleThreadId) {
        throw new Error("Validation error. No socialModuleThreadId provided");
      }

      await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
        subjectId: id,
        socialModuleChatId,
      });

      await this.service.socialModuleChatLifecycleAssertThreadBelongsToChat({
        socialModuleChatId,
        socialModuleThreadId,
      });

      const socialModuleChat = await this.service.socialModule.chat.findById({
        id: socialModuleChatId,
      });

      if (!socialModuleChat) {
        throw new Error("Not found error. Social module chat not found");
      }

      const socialModuleThread =
        await this.service.socialModule.thread.findById({
          id: socialModuleThreadId,
        });

      if (!socialModuleThread) {
        throw new Error("Not found error. Social module thread not found");
      }

      if (
        canMirrorTelegramTopic({ socialModuleChat }) &&
        socialModuleThread.sourceSystemId
      ) {
        await deleteTelegramForumTopic({
          socialModuleChat,
          messageThreadId: socialModuleThread.sourceSystemId,
        });
      }

      const socialModuleThreadChatLinks =
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
      const currentChatThreadLinks = (socialModuleThreadChatLinks || []).filter(
        (relation: any) => {
          return relation.chatId === socialModuleChatId;
        },
      );
      const isLinkedOnlyToCurrentChat = (
        socialModuleThreadChatLinks || []
      ).every((relation: any) => {
        return relation.chatId === socialModuleChatId;
      });

      if (isLinkedOnlyToCurrentChat) {
        await this.cleanupThreadMessages({
          socialModuleChatId,
          socialModuleThreadId,
          headers,
        });

        await socialModuleThreadApi.delete({
          id: socialModuleThreadId,
          options: {
            headers,
          },
        });
      } else {
        for (const relation of currentChatThreadLinks) {
          await socialModuleChatsToThreadsApi.delete({
            id: relation.id,
            options: {
              headers,
            },
          });
        }
      }

      return c.json({
        data: socialModuleThread,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
