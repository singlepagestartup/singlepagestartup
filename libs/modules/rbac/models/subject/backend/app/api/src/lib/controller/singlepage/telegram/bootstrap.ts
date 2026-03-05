import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context): Promise<Response> {
    try {
      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...).",
        );
      }

      let data: {
        telegram?: {
          fromId?: string | number;
          chatId?: string | number;
          messageText?: string;
        };
      };

      try {
        data = JSON.parse(body["data"]);
      } catch {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      const fromId = data?.telegram?.fromId;
      const chatId = data?.telegram?.chatId;

      if (fromId === undefined || fromId === null) {
        throw new Error("Validation error. 'data.telegram.fromId' is required");
      }

      if (chatId === undefined || chatId === null) {
        throw new Error("Validation error. 'data.telegram.chatId' is required");
      }

      const result = await this.service.telegramBootstrap({
        fromId: String(fromId),
        chatId: String(chatId),
        messageText: data?.telegram?.messageText,
      });

      return c.json({
        data: result,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
