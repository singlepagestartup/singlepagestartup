import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/agent/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { Handler as Dummy } from "./dummy";
import { Handler as Cron } from "./cron";
import { Handler as HostModulePageCache } from "./host-module/page/cache";
import { Handler as EcommerceOrderCheck } from "./ecommerce/order/check";

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
        method: "POST",
        path: "/cron",
        handler: this.cron,
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
        path: "/dummy",
        handler: this.dummy,
      },
      {
        method: "POST",
        path: "/ecommerce/order/check",
        handler: this.dummy,
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
        path: "/host-module-page-cache",
        handler: this.hostModulePageCache,
      },
    ]);
  }

  async dummy(c: Context, next: any): Promise<Response> {
    return new Dummy(this.service).execute(c, next);
  }

  async cron(c: Context, next: any): Promise<Response> {
    return new Cron(this.service).execute(c, next);
  }

  async ecommerceOrderCheck(c: Context, next: any): Promise<Response> {
    return new EcommerceOrderCheck(this.service).execute(c, next);
  }

  async hostModulePageCache(c: Context, next: any): Promise<Response> {
    return new HostModulePageCache(this.service).execute(c, next);
  }
}
