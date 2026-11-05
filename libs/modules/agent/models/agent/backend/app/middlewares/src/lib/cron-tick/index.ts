import { MUTATION_SKIPPED_CONTEXT_KEY } from "@sps/shared-utils";
import { createMiddleware } from "hono/factory";

export class Middleware {
  private lastMinute = -1;

  init() {
    return createMiddleware(async (c, next) => {
      // Model route middleware is mounted by path for every HTTP method.
      if (c.req.method !== "POST") {
        return next();
      }

      const minute = Math.floor(Date.now() / 60_000);
      if (minute <= this.lastMinute) {
        c.set(MUTATION_SKIPPED_CONTEXT_KEY, true);
        return c.body(null, 204);
      }

      this.lastMinute = minute;
      return next();
    });
  }
}
