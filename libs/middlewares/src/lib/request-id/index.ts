import { createMiddleware } from "hono/factory";
import { MiddlewareHandler } from "hono";
import { nanoid } from "nanoid";

export type IMiddlewareGeneric = unknown;

export class Middleware {
  constructor() {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const requestId = c.req.header("x-request-id") || nanoid();

      c.req.raw.headers.set("x-request-id", requestId);

      await next();
    });
  }
}
