import {
  NEXT_PUBLIC_TELEGRAM_SERVICE_URL,
  TELEGRAM_SERVICE_BOT_TOKEN,
} from "@sps/shared-utils";
import {
  Bot as GrammyBot,
  Middleware,
  webhookCallback,
  Context as GrammyContext,
  session,
} from "grammy";
import { Router } from "@grammyjs/router";
import {
  Conversation,
  ConversationFlavor as GrammyConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { Apps } from "./apps";

export type TelegramBotContext = GrammyContext & GrammyConversationFlavor;

export class TelegarmBot {
  instance: GrammyBot<TelegramBotContext>;
  webhookHandler: ReturnType<typeof webhookCallback>;
  router: Router<any>;
  conversations: {
    path: string;
    handler: (
      conversation: Conversation<any>,
      ctx: GrammyContext & GrammyConversationFlavor,
    ) => void;
  }[] = [];

  constructor() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      return;
    }

    this.instance = new GrammyBot<TelegramBotContext>(
      TELEGRAM_SERVICE_BOT_TOKEN || "",
    );

    this.router = new Router((ctx) => ctx.callbackQuery?.data || "");

    this.instance.use(this.router);
    this.instance.use(session({ initial: () => ({}) }));
    this.instance.use(conversations());

    this.addServiceActions();

    this.webhookHandler = webhookCallback(this.instance, "hono") as any;
  }

  addServiceActions() {
    this.instance.command(["cancel", "exit", "stop"], async (ctx) => {
      await ctx.conversation.exit();
      await ctx.reply("Leaving.");
    });
  }

  addRoutes(routes: { path: string; handler: Middleware }[]) {
    routes.forEach((route) => {
      this.router.route(route.path, route.handler);
    });
  }

  addConversations(
    conversations: {
      path: string;
      handler: (
        conversation: Conversation<any>,
        ctx: GrammyContext & GrammyConversationFlavor,
      ) => void;
    }[],
  ) {
    for (const conversation of conversations) {
      this.conversations.push(conversation);

      this.instance.use(
        createConversation(conversation.handler, {
          id: conversation.path,
        }),
      );
    }
  }

  /**
   * Should be called after routes and conversations are added
   */
  init() {
    this.router.route("main", async (ctx, next) => {
      ctx.reply("Main");

      await ctx.answerCallbackQuery();
      await next();
    });

    this.instance.on("callback_query:data", async (ctx, next) => {
      const data = ctx.callbackQuery?.data;

      const conversation = this.conversations?.find((conversation) => {
        return conversation.path === data;
      });

      if (conversation) {
        await ctx.conversation.enter(conversation.path);
        await ctx.answerCallbackQuery();
      }

      await next();
    });

    this.instance.command("start", async (ctx) => {
      ctx.reply("Hello!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Pages", callback_data: "/pages" }],
            [{ text: "Widgets", callback_data: "/widgets" }],
            [{ text: "Create Page", callback_data: "/pages/create" }],
            [{ text: "Main", callback_data: "main" }],
          ],
        },
      });
    });
  }

  async run() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    const endpoint = NEXT_PUBLIC_TELEGRAM_SERVICE_URL + "/api/telegram";

    const res = await this.instance.api.setWebhook(endpoint);

    return res;
  }

  async stop() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    const res = await this.instance.api.deleteWebhook();

    return res;
  }
}
