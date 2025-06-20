import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/action/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { Handler as FindByActionRoute } from "./find-by-action-route";
import { Handler as FindByIdRoutes } from "./find-by-id-routes";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;

    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/find-by-action-route",
        handler: this.findByActionRoute,
      },
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
        method: "GET",
        path: "/:uuid/routes",
        handler: this.findByIdRoutes,
      },
    ]);
  }

  public async findByActionRoute(c: Context, next: any): Promise<Response> {
    return new FindByActionRoute(this.service).execute(c, next);
  }

  public async findByIdRoutes(c: Context, next: any): Promise<Response> {
    return new FindByIdRoutes(this.service).execute(c, next);
  }
}
