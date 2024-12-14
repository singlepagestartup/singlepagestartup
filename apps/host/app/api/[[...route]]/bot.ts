import {
  TELEGRAM_BOT_BACKEND_URL,
  TELEGRAM_BOT_TOKEN,
} from "@sps/shared-utils";
import { Bot, webhookCallback } from "grammy";

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command("start", (ctx) => {
  console.log(`🚀 ~ bot.command ~ ctx.from?.username:`, ctx.from?.username);

  ctx.reply("Welcome!");
});

bot.command("help", (ctx) => ctx.reply("Here is some help text."));

bot.on("message", (ctx) => {
  ctx.react("👍");
  ctx.reply("Got your message!");
});

export const webhookHandler = webhookCallback(bot, "hono");

export async function run() {
  const endpoint = TELEGRAM_BOT_BACKEND_URL + "/api/telegram";

  const res = await bot.api.setWebhook(endpoint);

  return res;
}

export async function stop() {
  const res = await bot.api.deleteWebhook();

  return res;
}
