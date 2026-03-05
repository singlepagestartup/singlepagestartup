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
      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. Invalid id");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...).",
        );
      }

      let data: {
        chatId?: string | number;
      };

      try {
        data = JSON.parse(body["data"]);
      } catch {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      const chatId = data?.chatId;

      if (chatId === undefined || chatId === null) {
        throw new Error("Validation error. 'data.chatId' is required");
      }

      const result = await this.service.telegramCheckoutFreeSubscription({
        id,
        chatId: String(chatId),
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
