import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import type { Context } from "hono";
import { Table } from "@sps/rbac/models/role/backend/repository/database";
import { Service } from "../../service";
import { Handler as PublicResourceIds } from "./public-resource-ids";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  declare service: Service;
  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/public-resource-ids",
        handler: this.publicResourceIds,
      },
      ...this.httpRoutes,
    ]);
  }
  publicResourceIds(c: Context) {
    return new PublicResourceIds(this.service).execute(c);
  }
}
