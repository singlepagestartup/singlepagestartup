import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/channel/backend/repository/database";
import { Context, Next } from "hono";
import { Service } from "../../service";
import { Handler as MessageCreate } from "./message/create";
import { Handler as MessageDelete } from "./message/delete";
import { Handler as MessageFind } from "./message/find";
import { Handler as PushMessage } from "./push-message";

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
        handler: this.messageFind,
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
    return new MessageCreate(this.service).execute(c, next);
  }

  async messageDelete(c: Context, next: Next): Promise<Response> {
    return new MessageDelete(this.service).execute(c, next);
  }

  async pushMessage(c: Context, next: Next): Promise<Response> {
    return new PushMessage(this.service).execute(c, next);
  }

  async messageFind(c: Context, next: Next): Promise<Response> {
    return new MessageFind(this.service).execute(c, next);
  }
}
