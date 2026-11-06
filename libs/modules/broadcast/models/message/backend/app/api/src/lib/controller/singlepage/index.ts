import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/message/backend/repository/database";
import { Service } from "../../service";
import { Handler as Delivery } from "./delivery";
import type { Context } from "hono";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  declare service: Service;
  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.bindHttpRoutes([
      ...this.httpRoutes,
      { method: "POST", path: "/delivery", handler: this.delivery },
    ]);
  }

  delivery(c: Context) {
    return new Delivery(this.service).execute(c);
  }
}
