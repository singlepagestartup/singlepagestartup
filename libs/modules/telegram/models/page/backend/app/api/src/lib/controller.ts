import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/telegram/models/page/backend/repository/database";
import { Service } from "./service";
import { Context as GrammyContext, NextFunction } from "grammy";
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
    ]);
    this.bindTelegramRoutes([
      {
        path: "pages",
        handler: this.telegramIndex,
      },
    ]);
  }

  async telegramIndex(ctx: GrammyContext, next: NextFunction): Promise<void> {
    ctx.reply("Hello from pages");
    await ctx.answerCallbackQuery();

    await next();
  }
}
