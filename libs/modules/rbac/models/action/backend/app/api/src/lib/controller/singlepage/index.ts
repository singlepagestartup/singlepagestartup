import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/action/backend/repository/database";
import { Service } from "../../service";
import { Context } from "hono";
import { Handler as Consume } from "./consume";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;

    // Spread instead of re-declaring the CRUD list, so the model keeps every
    // base route it inherits.
    this.bindHttpRoutes([
      ...this.httpRoutes,
      {
        method: "POST",
        path: "/:uuid/consume",
        handler: this.consume,
      },
    ]);
  }

  public async consume(c: Context, next: any): Promise<Response> {
    return new Consume(this.service).execute(c, next);
  }
}
