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

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new HTTPException(400, {
          message: "Invalid data, data is required.",
        });
      }

      const data = JSON.parse(body["data"]);

      const message = await messageApi.create({
        data,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await channelsToMessagesApi.create({
        data: {
          channelId: id,
          messageId: message.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: message,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
