import { TelegramBot } from "@sps/shared-third-parties/telegram";
import { GrammyError } from "grammy";
import { logger } from "@sps/backend-utils";
import {
  BUG_SERVICE_PROJECT,
  BUG_SERVICE_REPORT_WINDOW_IN_SECONDS,
  BUG_SERVICE_TELEGRAM_BOT_TOKEN,
  BUG_SERVICE_TELEGRAM_CHAT_ID,
  createMemoryCache,
} from "@sps/shared-utils";

const timeoutSeconds = 3;
const reported = createMemoryCache({
  ttlMs: BUG_SERVICE_REPORT_WINDOW_IN_SECONDS * 1000,
  maxSize: 1000,
});
let sending = false;
let backoffUntil = 0;

interface IAlert {
  status: number;
  method: string;
  route: string;
  requestId: string;
}

export function reportToTelegram(alert: IAlert) {
  if (
    alert.status < 500 ||
    !BUG_SERVICE_TELEGRAM_BOT_TOKEN ||
    !BUG_SERVICE_TELEGRAM_CHAT_ID ||
    !BUG_SERVICE_PROJECT ||
    sending ||
    Date.now() < backoffUntil
  ) {
    return;
  }
  const signature = `${alert.status} ${alert.method} ${alert.route}`;
  if (reported.get(signature)) {
    return;
  }
  sending = true;
  void send(
    BUG_SERVICE_TELEGRAM_BOT_TOKEN,
    BUG_SERVICE_TELEGRAM_CHAT_ID,
    signature,
    alert.requestId,
  );
}

async function send(
  token: string,
  chatId: string,
  signature: string,
  requestId: string,
) {
  try {
    const bot = new TelegramBot(token, { client: { timeoutSeconds } });
    const text = `${BUG_SERVICE_PROJECT}\n${signature}\nrequestId: ${requestId}`;
    try {
      await bot.api.sendMessage(chatId, text);
    } catch (error) {
      if (
        !(error instanceof GrammyError) ||
        !error.parameters.migrate_to_chat_id
      ) {
        throw error;
      }
      await bot.api.sendMessage(error.parameters.migrate_to_chat_id, text);
    }
    reported.set(signature, true);
  } catch {
    backoffUntil = Date.now() + BUG_SERVICE_REPORT_WINDOW_IN_SECONDS * 1000;
    logger.errorEvent({
      event: "api.telegram.unavailable",
      occurredAt: new Date().toISOString(),
      requestId,
    });
  } finally {
    sending = false;
  }
}
