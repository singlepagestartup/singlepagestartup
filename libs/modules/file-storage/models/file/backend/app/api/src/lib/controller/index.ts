import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import { Context } from "hono";
import { Service } from "../service";
import { Handler as Create } from "./create";
import { Handler as CreateFromUrl } from "./create-from-url";
import { Handler as Delete } from "./delete";
import { Handler as Update } from "./update";

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
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "POST",
        path: "/create-from-url",
        handler: this.createFromUrl,
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

  async create(c: Context, next: any): Promise<Response> {
    return new Create(this.service).execute(c, next);
  }

  async createFromUrl(c: Context, next: any): Promise<Response> {
    return new CreateFromUrl(this.service).execute(c, next);
  }

  async update(c: Context, next: any): Promise<Response> {
    return new Update(this.service).execute(c, next);
  }

  async delete(c: Context, next: any): Promise<Response> {
    return new Delete(this.service).execute(c, next);
  }
}
