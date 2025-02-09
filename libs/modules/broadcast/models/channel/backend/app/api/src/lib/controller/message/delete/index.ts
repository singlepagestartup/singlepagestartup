import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as messageApi } from "@sps/broadcast/models/message/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as channelsToMessagesApi } from "@sps/broadcast/relations/channels-to-messages/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const headers = c.req.header();

      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY is not defined",
        });
      }

      const id = c.req.param("id");

      if (!id) {
        throw new HTTPException(400, {
          message: "Invalid id, id is required.",
        });
      }

      const messageId = c.req.param("messageId");

      if (!messageId) {
        throw new HTTPException(400, {
          message: "Invalid messageId, messageId is required.",
        });
      }

      const channelsToMessages = await channelsToMessagesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "channelId",
                method: "eq",
                value: id,
              },
              {
                column: "messageId",
                method: "eq",
                value: messageId,
              },
            ],
          },
        },
      });

      if (channelsToMessages?.length) {
        for (const channelToMessage of channelsToMessages) {
          await channelsToMessagesApi
            .delete({
              id: channelToMessage.id,
              options: {
                headers,
              },
            })
            .catch((error) => {
              //
            });
        }
      }

      const message = await messageApi
        .delete({
          id: messageId,
          options: {
            headers,
          },
        })
        .catch((error) => {
          //
        });

      return c.json({
        data: {
          ok: true,
        },
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
