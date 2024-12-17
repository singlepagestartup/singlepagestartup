import {
  TELEGRAM_BOT_BACKEND_URL,
  TELEGRAM_BOT_TOKEN,
} from "@sps/shared-utils";
import { Bot as GrammyBot, Middleware, webhookCallback } from "grammy";
import { Router } from "@grammyjs/router";

export class TelegarmBot {
  instance: GrammyBot;
  webhookHandler: ReturnType<typeof webhookCallback>;
  router: Router<any>;

  constructor() {
    if (!TELEGRAM_BOT_TOKEN) {
      return;
    }

    this.instance = new GrammyBot(TELEGRAM_BOT_TOKEN || "");
    this.router = new Router((ctx) => ctx.callbackQuery?.data || "");

    this.setRoutes();
    this.webhookHandler = webhookCallback(this.instance, "hono") as any;
  }

  setRoutes() {
    this.instance.use(this.router);

    this.router.route("main", async (ctx, next) => {
      ctx.reply("Main");

      await ctx.answerCallbackQuery();
      await next();
    });

    this.instance.on("callback_query:data", async (ctx, next) => {
      const data = ctx.callbackQuery?.data;

      console.log(`🚀 ~ this.instance.callbackQuery ~ data:`, data);

      await next();
    });

    this.instance.command("start", async (ctx) => {
      ctx.reply("Hello!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Pages", callback_data: "pages" }],
            [{ text: "Pages 2", callback_data: "pages/2" }],
            [{ text: "Main", callback_data: "main" }],
          ],
        },
      });
    });
  }

  addRoutes(routes: { path: string; handler: Middleware }[]) {
    routes.forEach((route) => {
      this.router.route(route.path, route.handler);
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
