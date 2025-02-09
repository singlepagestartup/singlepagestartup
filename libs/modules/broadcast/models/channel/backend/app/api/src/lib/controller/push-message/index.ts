import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api } from "@sps/broadcast/models/channel/sdk/server";

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

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new HTTPException(400, {
          message: "Invalid data, data is required.",
        });
      }

      const data = JSON.parse(body["data"]);

      if (!data.slug || !data.payload) {
        throw new HTTPException(400, {
          message: "Invalid data, slug and payload are required.",
        });
      }

      const channels = await api.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: data.slug,
              },
            ],
          },
        },
        options: {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      });

      let channel = channels?.[0];

      if (!channels?.length) {
        channel = await api.create({
          data: {
            title: data.slug,
            slug: data.slug,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });
      }

      if (!channel) {
        throw new HTTPException(400, {
          message: "Channel not found",
        });
      }

      const createdMessage = await api.messageCreate({
        id: channel.id,
        data,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      return c.json({
        data: createdMessage,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
