import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/profile/backend/repository/database";
import { Context, Next } from "hono";
import { Service } from "../../service";
import { Handler as FindByIdChatFind } from "./chat/find";
import { Handler as Authors } from "./authors";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;
    this.bindHttpRoutes([
      ...(["GET", "HEAD"] as const).flatMap((method) => [
        {
          method,
          path: "/authors",
          handler: (c: Context) => new Authors(this.service).execute(c, "find"),
        },
        {
          method,
          path: "/authors/count",
          handler: (c: Context) =>
            new Authors(this.service).execute(c, "count"),
        },
        {
          method,
          path: "/authors/:id",
          handler: (c: Context) =>
            new Authors(this.service).execute(c, "detail"),
        },
      ]),
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/count",
        handler: this.count,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "GET",
        path: "/:id/chats",
        handler: this.findByIdChatFind,
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

  async findByIdChatFind(c: Context, next: Next): Promise<Response> {
    return new FindByIdChatFind(this.service).execute(c, next);
  }
}
