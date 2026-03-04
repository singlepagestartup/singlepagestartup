import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. Invalid id, id is required.");
      }

      const messageId = c.req.param("messageId");

      if (!messageId) {
        throw new Error(
          "Validation error. Invalid messageId, messageId is required.",
        );
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
          await this.service.channelsToMessages
            .delete({
              id: channelToMessage.id,
            })
            .catch((error) => {
              //
            });
        }
      }

      await this.service.messages
        .delete({
          id: messageId,
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
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
