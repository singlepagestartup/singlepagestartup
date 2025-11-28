import { Hono } from "hono";
import { cors } from "hono/cors";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { app as telegramApp } from "./src";

export const app = new Hono().basePath("/");

app.use(
  cors({
    origin: (origin) => {
      if (!origin) {
        return null;
      }

      return origin;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "X-CSRF-Token",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Set-Cookie",
      "Cache-Control",
      "X-RBAC-SECRET-KEY",
    ],
    credentials: true,
    maxAge: 86400,
  }),
);

app.get("/", (c) => {
  return c.text("OK", 200 as ContentfulStatusCode);
});

app.options("*", (c) => {
  return c.text("OK", 204 as ContentfulStatusCode);
});

app.route("/api/telegram", telegramApp.hono);
