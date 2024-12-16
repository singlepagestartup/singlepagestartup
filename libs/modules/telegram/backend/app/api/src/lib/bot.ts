import "reflect-metadata";
import {
  RBAC_SECRET_KEY,
  TELEGRAM_BOT_BACKEND_URL,
  TELEGRAM_BOT_TOKEN,
} from "@sps/shared-utils";
import {
  Context,
  Bot as GrammyBot,
  InlineKeyboard,
  Keyboard,
  session,
  SessionFlavor,
  webhookCallback,
} from "grammy";
import { Menu } from "@grammyjs/menu";
import { api as websiteBuilderWidgetApi } from "@sps/website-builder/models/widget/sdk/server";
import { api as websiteBuilderWidgetsToButtonsArraysApi } from "@sps/website-builder/relations/widgets-to-buttons-arrays/sdk/server";
import { api as websiteBuilderButtonsArrayApi } from "@sps/website-builder/models/buttons-array/sdk/server";
import { api as websiteBuilderButtonsArraysToButtonsApi } from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/server";
import { api as websiteBuilderButtonApi } from "@sps/website-builder/models/button/sdk/server";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { injectable } from "inversify";
import { Router } from "@grammyjs/router";

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
      const ik = new InlineKeyboard().add({
        text: "Нажми меня",
        callback_data: "index",
      });

      ctx.reply("Привет! Я бот.", {
        reply_markup: ik,
      });
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
