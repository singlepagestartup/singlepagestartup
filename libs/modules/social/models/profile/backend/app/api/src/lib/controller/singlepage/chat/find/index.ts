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

      const profilesToChats = await this.service.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: id,
              },
            ],
          },
        },
      });

      if (!profilesToChats?.length) {
        return c.json({
          data: [],
        });
      }

      const chatIds = Array.from(
        new Set(profilesToChats.map((item) => item.chatId)),
      );
      const existingChatFilters = Array.isArray(parsedQuery?.filters?.and)
        ? parsedQuery.filters.and
        : [];

      const mergedParams: FindServiceProps["params"] = {
        orderBy: parsedQuery?.orderBy,
        offset: parsedQuery?.offset,
        limit: parsedQuery?.limit,
        filters: {
          and: [
            ...existingChatFilters,
            {
              column: "id",
              method: "inArray",
              value: chatIds,
            },
          ],
        },
      };

      const chats = await this.service.chat.find({
        params: mergedParams,
      });

      return c.json({
        data: chats,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
