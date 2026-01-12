import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/agent/backend/repository/database";
import { Service } from "../../service";
import { Context } from "hono";
import { Handler as Dummy } from "./dummy";
import { Handler as Cron } from "./cron";
import { Handler as HostModulePageCache } from "./page/cache";
import { Handler as EcommerceModuleOrdersCheck } from "./ecommerce-module/order/check";
import { Handler as EcommerceModuleOrdersDeleteCanceled } from "./ecommerce-module/order/delete-canceled";
import { Handler as TelegramBot } from "./telegram/bot";
import { Handler as BillingModulePaymentIntentsCheck } from "./billing-module/payment-intent/check";
import { Handler as BillingModulePaymentIntentsDeleteFailed } from "./billing-module/payment-intent/delete-failed";
import { Handler as BillingModuleInvoicesDeleteFailed } from "./billing-module/invoice/delete-failed";
import { Handler as NotificationModuleTopicsSendAll } from "./notification-module/topics/send-all";
import { Handler as BroadcastModuleMessageDeleteExpired } from "./broadcast-module/message/delete-expied";
import { Handler as RbacModuleSubjectDeleteAnonymous } from "./rbac-module/subject/delete-anonymous";
import { Handler as RbacModuleSubjectCheck } from "./rbac-module/subject/check";

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
        path: "/telegram-bot",
        handler: this.telegramBot,
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
      {
        method: "POST",
        path: "/broadcast-module-messages-delete-expired",
        handler: this.broadcastModuleMessageDeleteExpired,
      },
      {
        method: "POST",
        path: "/ecommerce-module-orders-delete-canceled",
        handler: this.ecommerceModuleOrdersDeleteCanceled,
      },
      {
        method: "POST",
        path: "/billing-module-payment-intents-delete-failed",
        handler: this.billingModulePaymentIntentsDeleteFailed,
      },
      {
        method: "POST",
        path: "/billing-module-invoices-delete-failed",
        handler: this.billingModuleInvoicesDeleteFailed,
      },
      {
        method: "POST",
        path: "/rbac-module-subjects-delete-anonymous",
        handler: this.rbacModuleSubjectDeleteAnonymous,
      },
      {
        method: "POST",
        path: "/rbac-module-subjects-check",
        handler: this.rbacModuleSubjectCheck,
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

  async telegramBot(c: Context, next: any): Promise<Response> {
    return new TelegramBot(this.service).execute(c, next);
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

  async broadcastModuleMessageDeleteExpired(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new BroadcastModuleMessageDeleteExpired(this.service).execute(
      c,
      next,
    );
  }

  async ecommerceModuleOrdersDeleteCanceled(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new EcommerceModuleOrdersDeleteCanceled(this.service).execute(
      c,
      next,
    );
  }

  async billingModulePaymentIntentsDeleteFailed(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new BillingModulePaymentIntentsDeleteFailed(this.service).execute(
      c,
      next,
    );
  }

  async billingModuleInvoicesDeleteFailed(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new BillingModuleInvoicesDeleteFailed(this.service).execute(c, next);
  }

  async rbacModuleSubjectDeleteAnonymous(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new RbacModuleSubjectDeleteAnonymous(this.service).execute(c, next);
  }

  async rbacModuleSubjectCheck(c: Context, next: any): Promise<Response> {
    return new RbacModuleSubjectCheck(this.service).execute(c, next);
  }
}
