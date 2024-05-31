import { HTTPException } from "hono/http-exception";
import { Hono } from "hono";
import { routes } from "./routes";

import { MiddlewaresGeneric } from "@sps/shared-backend-api";

export const app = new Hono<MiddlewaresGeneric>();

app.get("/", async (c) => {
  try {
    return c.json({
      data: "sps-file-storage",
    });
  } catch (error: any) {
    throw new HTTPException(400, {
      message: error.message,
    });
  }
});

for (const route in routes) {
  app.route(route, routes[route as keyof typeof routes]);
}
