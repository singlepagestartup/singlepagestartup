import "reflect-metadata";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { injectable } from "inversify";
import { HTTPResponseError } from "hono/types";
import { IFilter } from "./interface";
export { type IFilter } from "./interface";
import { logger } from "@sps/backend-utils";
import { Bot } from "grammy";
import {
  BUG_SERVICE_PROJECT,
  BUG_SERVICE_TELEGRAM_BOT_TOKEN,
  BUG_SERVICE_TELEGRAM_CHAT_ID,
} from "@sps/shared-utils";
import { decode } from "hono/jwt";

const isDebug =
  process.env.NODE_ENV === "development" || process.env.DEBUG === "true";

@injectable()
export class Filter implements IFilter {
  async catch(
    error: Error | HTTPResponseError,
    c: Context<any>,
  ): Promise<Response> {
    const requestId = c.req.header("x-request-id") || "unknown";

    let errorMessages: string[] = [];
    let stack = isDebug ? error.stack || "" : undefined;
    let status = error instanceof HTTPException ? error.status : 500;
    let path = c.req.url;
    let method = c.req.method;
    let causes: { message: string; stack?: string }[] = [];

    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.message) errorMessages.push(parsedError.message);
      if (parsedError.status) status = parsedError.status;
      if (parsedError.cause) {
        causes = Array.isArray(parsedError.cause)
          ? parsedError.cause.map((e) => ({
              message: e.message,
              stack: isDebug ? e.stack.replace(/\\n/g, "\n") : undefined,
            }))
          : [{ message: parsedError.cause, stack }];
        errorMessages.push(...causes.map((e) => e.message));
      }
    } catch {
      // Not JSON
      errorMessages.push(error.message);
    }

    causes.push({ message: errorMessages.join(" | "), stack });

    logger.error(
      `🚨 Exception [${requestId}] ${method} ${path}`,
      JSON.stringify(
        { message: errorMessages.join(" | "), stack, status, causes },
        null,
        2,
      ),
    );

    if (
      BUG_SERVICE_TELEGRAM_BOT_TOKEN &&
      BUG_SERVICE_TELEGRAM_CHAT_ID &&
      BUG_SERVICE_PROJECT &&
      status != 404
    ) {
      try {
        const authorizationHeader = c.req.header("Authorization") || "";
        let jwt = "";

        if (authorizationHeader) {
          jwt = decode(authorizationHeader.replace("Bearer ", "") || "").payload
            ?.subject?.["id"];
        }

        const bot = new Bot(BUG_SERVICE_TELEGRAM_BOT_TOKEN);
        await bot.api.sendMessage(
          BUG_SERVICE_TELEGRAM_CHAT_ID,
          `<b>${BUG_SERVICE_PROJECT}</b>\n🚨 <i>${status} | ${method}${jwt ? " by " + jwt : ""}</i> <pre>${path}</pre>\nError${errorMessages.join(" | ")}}`,
          {
            parse_mode: "HTML",
          },
        );
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
        error: errorMessages.join(" | "),
        stack: isDebug ? stack : undefined,
        cause: isDebug ? causes : undefined,
      },
      status,
    );
  }
}
