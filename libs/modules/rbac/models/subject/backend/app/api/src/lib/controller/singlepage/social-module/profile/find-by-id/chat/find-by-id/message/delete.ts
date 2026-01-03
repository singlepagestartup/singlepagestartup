import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
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

      const headers: Record<string, string> = {};
      const authorization = c.req.header("authorization");
      if (authorization) {
        headers.Authorization = authorization;
      }

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

      const chatToMessages = await socialModuleChatsToMessagesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: socialModuleChatId,
              },
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

      if (!chatToMessages?.length) {
        throw new Error("Not found error. Message not found in chat");
      }

      const socialModuleMessage = await socialModuleMessageApi.findById({
        id: socialModuleMessageId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleMessage) {
        throw new Error("Not found error. Social module message not found");
      }

      await rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdActionCreate({
        id,
        socialModuleProfileId,
        socialModuleChatId,
        data: {
          payload: {
            type: "delete",
            message: socialModuleMessage,
          },
        },
        options: {
          headers,
        },
      });

      const deleted = await socialModuleMessageApi.delete({
        id: socialModuleMessageId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: deleted,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
