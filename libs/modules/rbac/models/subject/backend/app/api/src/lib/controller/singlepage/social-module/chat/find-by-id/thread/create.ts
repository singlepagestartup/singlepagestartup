import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";
import { api as socialModuleChatsToThreadsApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import {
  canMirrorTelegramTopic,
  createTelegramForumTopic,
} from "./telegram-topic";

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

      const secretKey = this.getRequiredSecretKey();

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
        subjectId: id,
        socialModuleChatId,
      });

      const socialModuleChat = await this.service.socialModule.chat.findById({
        id: socialModuleChatId,
      });

      if (!socialModuleChat) {
        throw new Error("Not found error. Social module chat not found");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
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

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Validation error. Invalid thread payload");
      }

      const title =
        typeof data.title === "string" ? data.title.trim() : undefined;

      if (!title) {
        throw new Error("Validation error. Thread title is required");
      }

      const telegramTopic = canMirrorTelegramTopic({ socialModuleChat })
        ? await createTelegramForumTopic({
            socialModuleChat,
            title,
          })
        : null;

      if (telegramTopic) {
        const existingThread = await this.findExistingTelegramThread({
          socialModuleChatId,
          sourceSystemId: String(telegramTopic.message_thread_id),
        });

        if (existingThread) {
          const socialModuleThread = await socialModuleThreadApi.update({
            id: existingThread.id,
            data: {
              ...data,
              title,
              variant: data.variant || existingThread.variant || "telegram",
              sourceSystemId: String(telegramTopic.message_thread_id),
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": secretKey,
              },
            },
          });

          return c.json({
            data: socialModuleThread,
          });
        }
      }

      const socialModuleThread = await socialModuleThreadApi.create({
        data: {
          ...data,
          title,
          ...(telegramTopic
            ? {
                variant: data.variant || "telegram",
                sourceSystemId: String(telegramTopic.message_thread_id),
              }
            : {}),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": secretKey,
          },
        },
      });

      await socialModuleChatsToThreadsApi.create({
        data: {
          chatId: socialModuleChatId,
          threadId: socialModuleThread.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": secretKey,
          },
        },
      });

      return c.json({
        data: socialModuleThread,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  getRequiredSecretKey(): string {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    return RBAC_SECRET_KEY;
  }

  private async findExistingTelegramThread(props: {
    socialModuleChatId: string;
    sourceSystemId: string;
  }) {
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
    const threadIds =
      socialModuleChatsToThreads
        ?.map((relation: { threadId?: string }) => relation.threadId)
        .filter((threadId: string | undefined): threadId is string =>
          Boolean(threadId),
        ) || [];

    if (!threadIds.length) {
      return null;
    }

    const socialModuleThreads = await this.service.socialModule.thread.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: threadIds,
            },
            {
              column: "sourceSystemId",
              method: "eq",
              value: props.sourceSystemId,
            },
          ],
        },
      },
    });

    if (!socialModuleThreads?.length) {
      return null;
    }

    return [...socialModuleThreads].sort((a, b) => {
      const timestampDiff =
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime();

      if (timestampDiff !== 0) {
        return timestampDiff;
      }

      return String(a.id).localeCompare(String(b.id));
    })[0];
  }
}
