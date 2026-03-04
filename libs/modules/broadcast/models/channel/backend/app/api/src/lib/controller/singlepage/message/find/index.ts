import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import {
  type IParseQueryMiddlewareGeneric,
  type FindServiceProps,
} from "@sps/shared-backend-api";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(
    c: Context<IParseQueryMiddlewareGeneric>,
    next: any,
  ): Promise<Response> {
    try {
      const id = c.req.param("id");
      const parsedQuery = c.var.parsedQuery;

      if (!id) {
        throw new Error("Validation error. Invalid id, id is required.");
      }

      const channelsToMessages = await this.service.channelsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "channelId",
                method: "eq",
                value: id,
              },
            ],
          },
        },
      });

      if (channelsToMessages?.length) {
        const messageIds = Array.from(
          new Set(channelsToMessages.map((item) => item.messageId)),
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

        const messages = await this.service.messages.find({
          params: mergedParams,
        });

        return c.json({
          data: messages,
        });
      }

      return c.json({
        data: [],
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
