import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api } from "@sps/broadcast/models/channel/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid data, data is required.");
      }

      const data = JSON.parse(body["data"]);

      if (!data.slug || !data.payload) {
        throw new Error(
          "Validation error. Invalid data, slug and payload are required.",
        );
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
            "Cache-Control": "no-store",
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
          },
        });
      }

      if (!channel) {
        throw new Error("Not Found error. Channel not found");
      }

      const createdMessage = await api.messageCreate({
        id: channel.id,
        data,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: createdMessage,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
