import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { Handler as Checkout } from "./checkout";
import { Handler as Update } from "./update";
import { Handler as Check } from "./check";
import { Handler as CheckoutAttributes } from "./checkout-attributes";
import { Handler as ClearOldOrders } from "./clear-old-orders";

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
        method: "GET",
        path: "/:uuid/checkout-attributes/:billingModuleCurrencyId",
        handler: this.checkoutAttributes,
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
        path: "/:uuid/checkout",
        handler: this.checkout,
      },
      {
        method: "POST",
        path: "/:uuid/check",
        handler: this.check,
      },
      {
        method: "POST",
        path: "/clear-old-orders",
        handler: this.clearOldOrders,
      },
    ]);
  }

  async checkout(c: Context, next: any): Promise<Response> {
    return new Checkout(this.service).execute(c, next);
  }

  async update(c: Context, next: any): Promise<Response> {
    return new Update(this.service).execute(c, next);
  }

  async check(c: Context, next: any): Promise<Response> {
    return new Check(this.service).execute(c, next);
  }

  async checkoutAttributes(c: Context, next: any): Promise<Response> {
    return new CheckoutAttributes(this.service).execute(c, next);
  }

  async clearOldOrders(c: Context, next: any): Promise<Response> {
    return new ClearOldOrders(this.service).execute(c, next);
  }
}