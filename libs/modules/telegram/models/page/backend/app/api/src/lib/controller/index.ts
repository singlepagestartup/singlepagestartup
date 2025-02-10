import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/telegram/models/page/backend/repository/database";
import { api } from "@sps/telegram/models/page/sdk/server";
import { Service } from "../service";
import { Context as GrammyContext, NextFunction } from "grammy";
import {
  ConversationFlavor as GrammyConversationFlavor,
  Conversation as GrammyConversation,
} from "@grammyjs/conversations";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

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
    this.bindTelegramRoutes([]);
    this.bindTelegramConversations([
      {
        path: "/pages/create",
        handler: this.telegramCreate,
      },
    ]);
  }

  async telegramCommands(): Promise<
    | {
        path: string;
        handler: (
          conversation: GrammyConversation<any>,
          ctx: GrammyContext & GrammyConversationFlavor,
        ) => Promise<void>;
      }[]
    | undefined
  > {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined");
    }

    const pages = await api.find({
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    logger.debug("🚀 ~ pages:", pages);

    if (!pages) {
      return;
    }

    const pagesWithHandlers = pages.map((page) => {
      return {
        path: page.url,
        handler: this.telegramIndex,
      };
    });

    return pagesWithHandlers;
  }

  async telegramIndex(
    conversation: GrammyConversation<any>,
    ctx: GrammyContext & GrammyConversationFlavor,
  ): Promise<void> {
    ctx.reply("Hello from pages");
    await ctx.answerCallbackQuery();
  }

  async telegramCreate(
    conversation: GrammyConversation<any>,
    ctx: GrammyContext & GrammyConversationFlavor,
  ) {
    await ctx.reply("Create page. Type name:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Create Widget", callback_data: "/widgets/create" }],
          [{ text: "Widgets", callback_data: "/widgets" }],
        ],
      },
    });
    const { message } = await conversation.waitFor(":text");

    logger.debug("🚀 ~ message:", message);

    await ctx.reply(`Created page - ${message.text}!`);
  }
}
