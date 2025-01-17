import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/channel/backend/repository/database";
import { HTTPException } from "hono/http-exception";
import { Context, Next } from "hono";
import { Service } from "../service";
import { api as channelsToMessagesApi } from "@sps/broadcast/relations/channels-to-messages/sdk/server";
import { api as messageApi } from "@sps/broadcast/models/message/sdk/server";
import { api } from "@sps/broadcast/models/channel/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "POST",
        path: "/push-message",
        handler: this.pushMessage,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "GET",
        path: "/:id/messages",
        handler: this.messages,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "POST",
        path: "/:id/messages",
        handler: this.messageCreate,
      },
      {
        method: "DELETE",
        path: "/:id/messages/:messageId",
        handler: this.messageDelete,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
    ]);
  }

  async messageCreate(c: Context, next: Next): Promise<Response> {
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
  }

  async messageDelete(c: Context, next: Next): Promise<Response> {
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
        await channelsToMessagesApi.delete({
          id: channelToMessage.id,
          options: {
            headers,
          },
        });
      }
    }

    const message = await messageApi.delete({
      id: messageId,
      options: {
        headers,
      },
    });

    return c.json({
      data: message,
    });
  }

  async pushMessage(c: Context, next: Next): Promise<Response> {
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
  }

  async messages(c: Context, next: Next): Promise<Response> {
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
          "Cache-Control": "no-cache",
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
  }
}
