import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import {
  type FindServiceProps,
  type IParseQueryMiddlewareGeneric,
} from "@sps/shared-backend-api";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(
    c: Context<IParseQueryMiddlewareGeneric>,
    _next: any,
  ): Promise<Response> {
    try {
      const id = c.req.param("id");
      const parsedQuery = c.var.parsedQuery;

      if (!id) {
        throw new Error("Validation error. Invalid id, id is required.");
      }

      const chatsToMessages = await this.service.chatsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: id,
              },
            ],
          },
        },
      });

      if (!chatsToMessages?.length) {
        return c.json({
          data: [],
        });
      }

      const messageIds = Array.from(
        new Set(chatsToMessages.map((item) => item.messageId)),
      );
      const existingMessageFilters = Array.isArray(parsedQuery?.filters?.and)
        ? parsedQuery.filters.and
        : [];

      const mergedParams: FindServiceProps["params"] = {
        orderBy: parsedQuery?.orderBy,
        offset: parsedQuery?.offset,
        limit: parsedQuery?.limit,
        filters: {
          and: [
            ...existingMessageFilters,
            {
              column: "id",
              method: "inArray",
              value: messageIds,
            },
          ],
        },
      };

      const messages = await this.service.message.find({
        params: mergedParams,
      });

      return c.json({
        data: messages,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
