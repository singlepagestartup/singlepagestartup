import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
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

      const channels = await this.service.find({
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
      });

      let channel = channels?.[0];

      if (!channels?.length) {
        channel = await this.service.create({
          data: {
            title: data.slug,
            slug: data.slug,
          },
        });
      }

      if (!channel) {
        throw new Error("Not Found error. Channel not found");
      }

      const createdMessage = await this.service.messages.create({
        data,
      });

      await this.service.channelsToMessages.create({
        data: {
          channelId: channel.id,
          messageId: createdMessage.id,
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
