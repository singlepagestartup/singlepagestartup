import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api as socialModuleProfilesToActionsApi } from "@sps/social/relations/profiles-to-actions/sdk/server";
import { api as socialModuleActionApi } from "@sps/social/models/action/sdk/server";
import { api as socialModuleChatsToActionsApi } from "@sps/social/relations/chats-to-actions/sdk/server";
import { api as socialModuleThreadsToActionsApi } from "@sps/social/relations/threads-to-actions/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  private async resolveThreadIdForMessageInChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
  }) {
    const socialModuleThreadsToMessages =
      await this.service.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessageId,
              },
            ],
          },
        },
      });

    if (!socialModuleThreadsToMessages?.length) {
      return;
    }

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
    const chatThreadIds = new Set(
      (socialModuleChatsToThreads || [])
        .map((relation: { threadId?: string }) => relation.threadId)
        .filter((threadId: string | undefined): threadId is string => {
          return Boolean(threadId);
        }),
    );
    const [threadToMessage] = socialModuleThreadsToMessages
      .filter((relation: { threadId?: string }) => {
        return Boolean(
          relation.threadId && chatThreadIds.has(relation.threadId),
        );
      })
      .sort((a, b) => {
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      });

    if (!threadToMessage?.threadId) {
      return;
    }

    return threadToMessage.threadId;
  }

  private getPayloadMessageId(data: Record<string, any>) {
    const message = data.payload?.message;

    if (!message || typeof message !== "object") {
      return;
    }

    return typeof message.id === "string" ? message.id : undefined;
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

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Validation error. Invalid action payload");
      }

      const actionData = { ...data };
      const querySocialModuleThreadId = c.req
        .query("socialModuleThreadId")
        ?.trim();
      const bodySocialModuleThreadId =
        typeof actionData.socialModuleThreadId === "string"
          ? actionData.socialModuleThreadId.trim()
          : undefined;
      const requestedSocialModuleThreadId =
        bodySocialModuleThreadId || querySocialModuleThreadId || undefined;
      delete actionData.socialModuleThreadId;

      let socialModuleThreadId = requestedSocialModuleThreadId;

      if (socialModuleThreadId) {
        await this.service.socialModuleChatLifecycleAssertThreadBelongsToChat({
          socialModuleChatId,
          socialModuleThreadId,
        });
      } else {
        const payloadMessageId = this.getPayloadMessageId(actionData);

        if (payloadMessageId) {
          socialModuleThreadId = await this.resolveThreadIdForMessageInChat({
            socialModuleChatId,
            socialModuleMessageId: payloadMessageId,
          });
        }
      }

      const socialMouleAction = await socialModuleActionApi.create({
        data: actionData,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await socialModuleChatsToActionsApi.create({
        data: {
          actionId: socialMouleAction.id,
          chatId: socialModuleChatId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (socialModuleThreadId) {
        await socialModuleThreadsToActionsApi.create({
          data: {
            actionId: socialMouleAction.id,
            threadId: socialModuleThreadId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }

      socialModuleProfilesToActionsApi
        .create({
          data: {
            actionId: socialMouleAction.id,
            profileId: socialModuleProfileId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        })
        .catch(() => {
          //
        });

      return c.json({
        data: socialMouleAction,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
