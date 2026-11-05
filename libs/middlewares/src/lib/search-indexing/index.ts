import { createMiddleware } from "hono/factory";

/** JSON API responses are data transports, not standalone search documents. */
export class Middleware {
  init() {
    return createMiddleware(async (c, next) => {
      await next();
      if (
        c.res.headers
          .get("Content-Type")
          ?.toLowerCase()
          .includes("application/json")
      )
        c.header("X-Robots-Tag", "noindex");
    });
  }
}
