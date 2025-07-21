import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/agent/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { Handler as Dummy } from "./dummy";
import { Handler as Cron } from "./cron";
import { Handler as HostModulePageCache } from "./host-module/page/cache";
import { Handler as EcommerceModuleOrdersCheck } from "./ecommerce-module/order/check";
import { Handler as OpenAiGpt4oMini } from "./ai/open-ai/gpt-4o-mini";
import { Handler as BillingModulePaymentIntentsCheck } from "./billing-module/payment-intent/check";
import { Handler as NotificationModuleTopicsSendAll } from "./notification-module/topics/send-all";

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
        path: "/ecommerce-module-orders-check",
        handler: this.ecommerceModuleOrdersCheck,
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
      {
        method: "POST",
        path: "/ai/open-ai/gpt-4o-mini",
        handler: this.openAiGpt4oMini,
      },
      {
        method: "POST",
        path: "/billing-module-payment-intents-check",
        handler: this.billingModulePaymentIntentsCheck,
      },
      {
        method: "POST",
        path: "/notification-module-topics-send-all",
        handler: this.notificationModuleTopicsSendAll,
      },
    ]);
  }

  async dummy(c: Context, next: any): Promise<Response> {
    return new Dummy(this.service).execute(c, next);
  }

  async cron(c: Context, next: any): Promise<Response> {
    return new Cron(this.service).execute(c, next);
  }

  async ecommerceModuleOrdersCheck(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrdersCheck(this.service).execute(c, next);
  }

  async hostModulePageCache(c: Context, next: any): Promise<Response> {
    return new HostModulePageCache(this.service).execute(c, next);
  }

  async openAiGpt4oMini(c: Context, next: any): Promise<Response> {
    return new OpenAiGpt4oMini(this.service).execute(c, next);
  }

  async billingModulePaymentIntentsCheck(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new BillingModulePaymentIntentsCheck(this.service).execute(c, next);
  }

  async notificationModuleTopicsSendAll(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new NotificationModuleTopicsSendAll(this.service).execute(c, next);
  }
}
