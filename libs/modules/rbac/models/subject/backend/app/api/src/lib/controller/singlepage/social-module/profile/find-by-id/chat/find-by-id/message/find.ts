import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
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

      const parsedQuery = c.get("parsedQuery");
      const limit = parsedQuery?.limit || 100;
      const offset = parsedQuery?.offset || 0;
      const orderBy = parsedQuery?.orderBy;

      const socialModuleChatsToMessages =
        await this.service.socialModule.chatsToMessages.find({
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
            limit,
            offset,
            orderBy,
          },
        });

      if (!socialModuleChatsToMessages?.length) {
        return c.json({
          data: [],
        });
      }

      const socialModuleMessages = await this.service.socialModule.message.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: socialModuleChatsToMessages?.map(
                    (socialModuleChatsToMessage) => {
                      return socialModuleChatsToMessage.messageId;
                    },
                  ),
                },
              ],
            },
            orderBy,
          },
        },
      );

      return c.json({
        data: socialModuleMessages,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
