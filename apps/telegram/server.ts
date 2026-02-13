import "./env";
import { serve } from "bun";
import { app } from "./app";
import { app as telegramApp } from "./src";
import { TELEGRAM_SERVICE_PORT } from "@sps/shared-utils";

if (telegramApp.telegramBot?.instance) {
  void telegramApp.telegramBot.run().catch((error) => {
    console.error("Failed to set Telegram webhook:", error);
  });
}

serve({
  fetch: app.fetch,
  port: TELEGRAM_SERVICE_PORT,
  idleTimeout: 60,
});
