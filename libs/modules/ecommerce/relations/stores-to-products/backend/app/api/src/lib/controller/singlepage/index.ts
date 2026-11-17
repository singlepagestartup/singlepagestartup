import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import type { Context } from "hono";
import { Service } from "../../service";
import { Handler as Quote } from "./quote";

@injectable()
export class Controller extends RESTController<typeof Table.$inferSelect> {
  constructor(@inject(DI.IService) readonly service: Service) {
    super(service);
    this.bindHttpRoutes([
      ...this.httpRoutes,
      { method: "POST", path: "/:uuid/quote", handler: this.quote },
    ]);
  }
  async quote(c: Context) {
    return new Quote(this.service).execute(c);
  }
}
