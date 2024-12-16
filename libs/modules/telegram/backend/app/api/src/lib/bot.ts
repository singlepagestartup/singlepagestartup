import "reflect-metadata";
import {
  RBAC_SECRET_KEY,
  TELEGRAM_BOT_BACKEND_URL,
  TELEGRAM_BOT_TOKEN,
} from "@sps/shared-utils";
import { Bot as GrammyBot, InlineKeyboard, webhookCallback } from "grammy";
import { injectable } from "inversify";
import { Router } from "@grammyjs/router";
import { api as telegramPageApi } from "@sps/telegram/models/page/sdk/server";
import { api as telegramWidgetApi } from "@sps/telegram/models/widget/sdk/server";
import { api as telegramPagesToWidgetsApi } from "@sps/telegram/relations/pages-to-widgets/sdk/server";

@injectable()
export class Bot {
  instance: GrammyBot;
  webhookHandler: ReturnType<typeof webhookCallback>;

  constructor() {
    if (!TELEGRAM_BOT_TOKEN) {
      return;
    }

    this.instance = new GrammyBot(TELEGRAM_BOT_TOKEN || "");

    this.webhookHandler = webhookCallback(this.instance, "hono") as any;
    this.setRoutes();
  }

  setRoutes() {
    const router = new Router((ctx) => ctx.callbackQuery?.data || "");

    router.route("index", async (ctx) => {
      ctx.reply("Выберите категорию:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Товары", callback_data: "index/products" }],
            [{ text: "Услуги", callback_data: "index/services" }],
          ],
        },
      });
      await ctx.answerCallbackQuery();
    });

    router.route("index/products", async (ctx) => {
      ctx.reply("Выберите продукт:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Продукт 1", callback_data: "menu/products/1" }],
            [{ text: "Продукт 2", callback_data: "menu/products/2" }],
          ],
        },
      });
      await ctx.answerCallbackQuery();
    });

    router.route("index/services", async (ctx) => {
      ctx.reply("Выберите услугу:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Услуга A", callback_data: "menu/services/A" }],
            [{ text: "Услуга B", callback_data: "menu/services/B" }],
          ],
        },
      });
      await ctx.answerCallbackQuery();
    });

    this.instance.use(router);

    this.instance.command("start", async (ctx) => {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY is not set");
      }

      const startPages = await telegramPageApi.find({
        params: {
          filters: {
            and: [
              {
                column: "url",
                method: "eq",
                value: "/start",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!startPages?.length) {
        ctx.reply("Welcome to Single Page Startup");
        return;
      }

      const startPage = startPages[0];

      const pagesToWidgets = await telegramPagesToWidgetsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "pageId",
                method: "eq",
                value: startPage.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!pagesToWidgets?.length) {
        ctx.reply("Welcome to Single Page Startup");
        return;
      }

      const widgets = await telegramWidgetApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: pagesToWidgets[0].widgetId,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!widgets?.length) {
        ctx.reply("Welcome to Single Page Startup");
        return;
      }

      if (widgets.every((widget) => !widget.title)) {
        ctx.reply("Welcome to Single Page Startup");
        return;
      }

      for (const widget of widgets) {
        if (widget.title) {
          ctx.reply(widget.title);
        }
      }

      // const ik = new InlineKeyboard().add({
      //   text: "Нажми меня",
      //   callback_data: "index",
      // });

      // ctx.reply("Привет! Я бот.", {
      //   reply_markup: ik,
      // });
    });
  }

  async run() {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    const endpoint = TELEGRAM_BOT_BACKEND_URL + "/api/telegram";

    const res = await this.instance.api.setWebhook(endpoint);

    return res;
  }

  async stop() {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    const res = await this.instance.api.deleteWebhook();

    return res;
  }
}
