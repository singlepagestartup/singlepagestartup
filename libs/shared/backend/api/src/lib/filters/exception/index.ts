import "reflect-metadata";
import { Context } from "hono";
import { injectable } from "inversify";
import { HTTPResponseError } from "hono/types";
import { IFilter } from "./interface";
export { type IFilter } from "./interface";
import {
  getHttpErrorType,
  RateLimitError,
  logger,
  requestDiagnostics,
  rbacSecretMatches,
  readRbacSecret,
  sanitizeErrorMessage,
} from "@sps/backend-utils";
import { API_ERROR_DETAILS } from "@sps/shared-utils";
import { errorEvent } from "./diagnostics";
import { reportToTelegram } from "./telegram";

@injectable()
export class Filter implements IFilter {
  async catch(
    error: Error | HTTPResponseError,
    c: Context<any>,
  ): Promise<Response> {
    const { requestId } = requestDiagnostics(c);

    const { status, category, message: detail } = getHttpErrorType(error);
    const message =
      detail === category + "." || detail.startsWith(category + ". ")
        ? detail
        : `${category}. ${detail}`;
    // Admission refusals are logged once per counter window by the limiter.
    // Do not inspect request bodies or enqueue Telegram work for every 429.
    if (error instanceof RateLimitError) {
      c.header("Cache-Control", "no-store");
      if (status === 503) {
        c.header("Retry-After", "1");
      }
      return c.json({ requestId, status, error: message }, status);
    }

    const event = await errorEvent(c, error, status, category);
    logger.errorEvent(event);
    reportToTelegram(event);

    const body = {
      requestId,
      path: event.route,
      method: event.method,
      status,
      error: message,
    };
    if (API_ERROR_DETAILS !== "full" && !rbacSecretMatches(readRbacSecret(c))) {
      if (status >= 500) {
        body.error = category + ".";
      }
      return c.json(body, status);
    }
    const stack = sanitizeErrorMessage(error.stack || "");
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

    return c.json({ ...body, stack, cause: causes }, status);
  }
}
