import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";
import {
  canMirrorTelegramTopic,
  createTelegramForumTopic,
  editTelegramForumTopic,
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

      const existingSocialModuleThread =
        await this.service.socialModule.thread.findById({
          id: socialModuleThreadId,
        });

      if (!existingSocialModuleThread) {
        throw new Error("Not found error. Social module thread not found");
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

      let sourceSystemId = existingSocialModuleThread.sourceSystemId;

      if (canMirrorTelegramTopic({ socialModuleChat })) {
        if (sourceSystemId) {
          await editTelegramForumTopic({
            socialModuleChat,
            messageThreadId: sourceSystemId,
            title,
          });
        } else if (existingSocialModuleThread.variant !== "default") {
          const telegramTopic = await createTelegramForumTopic({
            socialModuleChat,
            title,
          });
          sourceSystemId = String(telegramTopic.message_thread_id);
        }
      }

      const socialModuleThread = await socialModuleThreadApi.update({
        id: socialModuleThreadId,
        data: {
          title,
          ...(sourceSystemId !== existingSocialModuleThread.sourceSystemId
            ? { sourceSystemId }
            : {}),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
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
}
