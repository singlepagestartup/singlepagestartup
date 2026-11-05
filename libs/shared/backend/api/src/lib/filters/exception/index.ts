import "reflect-metadata";
import { Context } from "hono";
import { injectable } from "inversify";
import { HTTPResponseError } from "hono/types";
import { IFilter } from "./interface";
export { type IFilter } from "./interface";
import {
  getHttpErrorType,
  logger,
  sanitizeErrorMessage,
} from "@sps/backend-utils";
import { Bot } from "grammy";
import {
  BUG_SERVICE_PROJECT,
  BUG_SERVICE_TELEGRAM_BOT_TOKEN,
  BUG_SERVICE_TELEGRAM_CHAT_ID,
} from "@sps/shared-utils";
import { decode } from "hono/jwt";

@injectable()
export class Filter implements IFilter {
  async catch(
    error: Error | HTTPResponseError,
    c: Context<any>,
  ): Promise<Response> {
    const requestId = c.req.header("x-request-id") || "unknown";

    const { status, category, message: detail } = getHttpErrorType(error);
    const message =
      detail === category + "." || detail.startsWith(category + ". ")
        ? detail
        : `${category}. ${detail}`;
    const stack = sanitizeErrorMessage(error.stack || "");
    const path = c.req.url;
    const method = c.req.method;
    const causes: { message: string; stack?: string }[] = [];
    try {
      const downstream = JSON.parse(error.message);
      if (Array.isArray(downstream?.cause)) {
        for (const cause of downstream.cause) {
          if (typeof cause?.message === "string") {
            causes.push({
              message: sanitizeErrorMessage(cause.message),
              stack:
                typeof cause.stack === "string"
                  ? sanitizeErrorMessage(cause.stack.replace(/\\n/g, "\n"))
                  : undefined,
            });
          }
        }
      } else if (typeof downstream?.cause === "string") {
        causes.push({ message: sanitizeErrorMessage(downstream.cause) });
      }
    } catch {
      // Local exceptions carry plain text. SDK exceptions can carry downstream causes.
    }
    causes.push({ message, stack });

    logger.error(
      `🚨 Exception [${requestId}] ${method} ${path}`,
      JSON.stringify({ message, stack, status, causes }, null, 2),
    );

    if (
      BUG_SERVICE_TELEGRAM_BOT_TOKEN &&
      BUG_SERVICE_TELEGRAM_CHAT_ID &&
      BUG_SERVICE_PROJECT &&
      status >= 500
    ) {
      try {
        const authorizationHeader = c.req.header("Authorization") || "";
        let jwt = "";

        if (authorizationHeader) {
          jwt = decode(authorizationHeader.replace("Bearer ", "") || "").payload
            ?.subject?.["id"];
        }

        const bot = new Bot(BUG_SERVICE_TELEGRAM_BOT_TOKEN);

        let chatId = BUG_SERVICE_TELEGRAM_CHAT_ID;
        const report = `<b>${BUG_SERVICE_PROJECT}</b>\n🚨 <i>${status} | ${method}${jwt ? " by " + jwt : ""}</i> <pre>${path}</pre>\nError: ${message}`;

        try {
          await bot.api.sendMessage(chatId, report, {
            parse_mode: "HTML",
          });
        } catch (telegramError: any) {
          // Handle chat migration to supergroup
          if (
            telegramError?.error_code === 400 &&
            telegramError?.parameters?.migrate_to_chat_id
          ) {
            chatId = telegramError.parameters.migrate_to_chat_id.toString();
            await bot.api.sendMessage(chatId, report, {
              parse_mode: "HTML",
            });
          } else {
            throw telegramError;
          }
        }
      } catch (error) {
        console.error("Failed to send error message to Telegram bot:", error);
      }
    }

    return c.json(
      {
        requestId,
        path,
        method,
        status,
        error: message,
        stack,
        cause: causes,
      },
      status,
    );
  }
}
