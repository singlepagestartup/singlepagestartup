import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/channel/backend/repository/database";
import { HTTPException } from "hono/http-exception";
import { Context, Next } from "hono";
import { Service } from "../service";

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
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
    ]);
  }

  async pushMessage(c: Context, next: Next): Promise<Response> {
    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new HTTPException(400, {
        message: "Invalid data, data is required.",
      });
    }

    const data = JSON.parse(body["data"]);

    if (!data.channelName || !data.payload) {
      throw new HTTPException(400, {
        message: "Invalid data, channelName and payload are required.",
      });
    }

    try {
      const entity = await this.service.pushMessage({ data });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }
}
