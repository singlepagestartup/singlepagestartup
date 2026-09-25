import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { routePath } from "hono/route";
import { injectable } from "inversify";
import { HTTPResponseError } from "hono/types";
import { IFilter } from "./interface";
export { type IFilter } from "./interface";
import {
  logger,
  rbacSecretMatches,
  readRbacSecret,
  sanitizeErrorMessage,
} from "@sps/backend-utils";
import { Bot } from "grammy";
import {
  API_ERROR_DETAILS,
  BUG_SERVICE_PROJECT,
  BUG_SERVICE_REPORT_WINDOW_IN_SECONDS,
  BUG_SERVICE_TELEGRAM_BOT_TOKEN,
  BUG_SERVICE_TELEGRAM_CHAT_ID,
  createMemoryCache,
} from "@sps/shared-utils";
import { decode } from "hono/jwt";

/**
 * Failures already sent to the bug chat. Every module app holds its own filter
 * instance, so the window lives at module level and covers the whole process.
 * A signature is the status, the method and the matched route pattern, so a
 * caller cannot mint new signatures by varying ids or the query string.
 */
const reportedFailures = createMemoryCache({
  ttlMs: BUG_SERVICE_REPORT_WINDOW_IN_SECONDS * 1000,
  maxSize: 1000,
});

@injectable()
export class Filter implements IFilter {
  async catch(
    error: Error | HTTPResponseError,
    c: Context<any>,
  ): Promise<Response> {
    const requestId = c.req.header("x-request-id") || randomUUID();

    let errorMessages: string[] = [];
    let stack = sanitizeErrorMessage(error.stack || "");
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
              stack: e.stack.replace(/\\n/g, "\n"),
            }))
          : [{ message: parsedError.cause, stack }];
        errorMessages.push(...causes.map((e) => e.message));
      }
    } catch {
      // Not JSON
      errorMessages.push(error.message);
    }

    causes = causes.map((cause) => ({
      message: sanitizeErrorMessage(cause.message),
      stack: sanitizeErrorMessage(cause.stack || ""),
    }));

    const message = sanitizeErrorMessage(errorMessages.join(" | "));

    causes.push({ message, stack });

    logger.error(
      `🚨 Exception [${requestId}] ${method} ${path}`,
      JSON.stringify({ message, stack, status, causes }, null, 2),
    );

    this.reportFailure({ c, status, method, path, message });

    const body = { requestId, path, method, status, error: message };

    if (!this.exposesDetails(c)) {
      return c.json(body, status);
    }

    return c.json({ ...body, stack, cause: causes }, status);
  }

  /**
   * The stack and the cause chain name server files and the services a request
   * passed through, so the body carries them only in the `full` mode or for a
   * caller holding the operator secret. The log record above keeps them in
   * every mode, under the request id the body returns.
   */
  private exposesDetails(c: Context<any>): boolean {
    return API_ERROR_DETAILS === "full" || rbacSecretMatches(readRbacSecret(c));
  }

  /**
   * Sends a 5xx to the bug chat without holding the response, once per failure
   * signature within BUG_SERVICE_REPORT_WINDOW_IN_SECONDS. A failed send is
   * logged by its message only: the error object of a failed request carries
   * the bot token in the URL it was sent to.
   */
  private reportFailure(props: {
    c: Context<any>;
    status: number;
    method: string;
    path: string;
    message: string;
  }) {
    if (
      !BUG_SERVICE_TELEGRAM_BOT_TOKEN ||
      !BUG_SERVICE_TELEGRAM_CHAT_ID ||
      !BUG_SERVICE_PROJECT ||
      props.status < 500
    ) {
      return;
    }

    const signature = `${props.status} ${props.method} ${routePath(props.c)}`;

    if (reportedFailures.get(signature)) {
      return;
    }

    reportedFailures.set(signature, true);

    const authorizationHeader = props.c.req.header("Authorization") || "";

    void (async () => {
      try {
        let jwt = "";

        if (authorizationHeader) {
          jwt = decode(authorizationHeader.replace("Bearer ", "") || "").payload
            ?.subject?.["id"];
        }

        const bot = new Bot(BUG_SERVICE_TELEGRAM_BOT_TOKEN);

        let chatId = BUG_SERVICE_TELEGRAM_CHAT_ID;
        const report = `<b>${BUG_SERVICE_PROJECT}</b>\n🚨 <i>${props.status} | ${props.method}${jwt ? " by " + jwt : ""}</i> <pre>${props.path}</pre>\nError: ${props.message}`;

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
        logger.error(
          "Failed to send error message to Telegram bot:",
          error instanceof Error ? error.message : String(error),
        );
      }
    })();
  }
}
