import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as messageApi } from "@sps/broadcast/models/message/sdk/server";
import { api as channelsToMessagesApi } from "@sps/broadcast/relations/channels-to-messages/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const id = c.req.param("id");
      const headers = c.req.header();

      if (!id) {
        throw new HTTPException(400, {
          message: "Invalid id, id is required.",
        });
      }

      /**
       * Without passing Cache-Control data are mismathed, because
       * http-cache middleware use this models
       */
      const channelsToMessages = await channelsToMessagesApi.find({
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
        options: {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      });

      if (channelsToMessages?.length) {
        const messages = await messageApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: channelsToMessages.map((c) => c.messageId),
                },
              ],
            },
          },
          options: {
            headers,
          },
        });

        return c.json({
          data: messages,
        });
      }

      return c.json({
        data: [],
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
