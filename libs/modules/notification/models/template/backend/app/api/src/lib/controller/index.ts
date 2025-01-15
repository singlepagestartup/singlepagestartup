import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/template/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

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
        method: "GET",
        path: "/dump",
        handler: this.dump,
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
      {
        method: "POST",
        path: "/:uuid/render",
        handler: this.render,
      },
    ]);
  }

  async render(c: Context, next: any): Promise<Response> {
    try {
      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      if (!uuid) {
        throw new HTTPException(400, {
          message: "Invalid id",
        });
      }

      if (body["data"] && typeof body["data"] !== "string") {
        return c.json(
          {
            message: "Invalid body",
          },
          {
            status: 400,
          },
        );
      }

      const payloadData = JSON.parse(body["data"]);

      const data = await this.service.render({
        id: uuid,
        type: "email",
        payload: payloadData,
      });

      if (!data || !Object.keys(data).length) {
        return c.json(
          {
            message: "Not found",
          },
          404,
        );
      }

      return c.json({
        data,
      });
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }
}
