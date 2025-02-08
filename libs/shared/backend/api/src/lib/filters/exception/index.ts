import "reflect-metadata";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { injectable } from "inversify";
import { HTTPResponseError } from "hono/types";
import { Sentry } from "@sps/shared-third-parties";
import { SENTRY_DSN } from "@sps/shared-utils";
import { IFilter } from "./interface";

@injectable()
export class Filter implements IFilter {
  async catch(
    error: Error | HTTPResponseError,
    c: Context<any>,
  ): Promise<Response> {
    const requestId = c.req.header("x-request-id") || "unknown";

    const stack =
      error instanceof HTTPException && error.cause instanceof Error
        ? error.cause.stack
        : error.stack;

    console.error(
      `🚨 Exception [${requestId}] ${c.req.method} ${c.req.url}`,
      error,
      stack,
    );

    if (SENTRY_DSN) {
      Sentry.setTag("request_id", requestId);
      Sentry.captureException(error);
    }

    return c.json(
      {
        requestId,
        path: c.req.url,
        error: error.message,
        stack: process.env.NODE_ENV !== "production" ? stack : undefined,
      },
      error instanceof HTTPException ? error.status : 500,
    );
  }
}
