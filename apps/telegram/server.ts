import "./env";
import { serve } from "bun";
import { app } from "./app";
import { app as telegramApp } from "./src";
import { TELEGRAM_SERVICE_PORT } from "@sps/shared-utils";
import { runTelegramStartupWithRetry } from "./src/lib/startup";

serve({
  fetch: app.fetch,
  port: TELEGRAM_SERVICE_PORT,
  idleTimeout: 60,
});

if (telegramApp.telegramBot?.instance) {
  void runTelegramStartupWithRetry({
    synchronize: () => telegramApp.telegramBot.run(),
    onFailure: ({ attempt, error, retryDelayMs }) => {
      console.error("Telegram startup synchronization failed; retrying.", {
        attempt,
        error,
        retryDelayMs,
      });
    },
    onSuccess: () => {
      console.info("Telegram commands and webhook synchronized.");
    },
  });
}
