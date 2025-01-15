import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/telegram/models/widget/backend/repository/database";
import { Context as GrammyContext, NextFunction } from "grammy";
import { Service } from "../service";
import {
  ConversationFlavor as GrammyConversationFlavor,
  Conversation as GrammyConversation,
} from "@grammyjs/conversations";
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
        path: "/widgets",
        handler: this.telegramIndex,
      },
    ]);
    this.bindTelegramConversations([
      {
        path: "/widgets/create",
        handler: this.telegramCreate,
      },
    ]);
  }

  async telegramIndex(ctx: GrammyContext, next: NextFunction): Promise<void> {
    try {
      // ctx.reply("Hello from widgets");
      // throw new Error("Method not implemented.");
      const mes = await this.service.telegramWidgets();

      // await this.service.telegramWidgets({ ctx });
      if (mes) {
        ctx.reply(mes.join("\n"));
      }

      await ctx.answerCallbackQuery();

      await next();
    } catch (error: any) {
      if (error.message) {
        ctx.reply("Error" + error.message);
        return;
      }

      ctx.reply("Error");
    }
  }

  async telegramCreate(
    conversation: GrammyConversation<any>,
    ctx: GrammyContext & GrammyConversationFlavor,
  ) {
    await ctx.reply("Create widget. Type name:");
    const { message } = await conversation.wait();
    await ctx.reply(`Created widget - ${message.text}!`);
  }
}
