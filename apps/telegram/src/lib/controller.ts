import "reflect-metadata";
import { injectable } from "inversify";
import { Service } from "./service";
import { Context, MiddlewareHandler } from "hono";
import { TelegarmBot } from "./telegram-bot";
import { HTTPException } from "hono/http-exception";
// Imported from its own path rather than the package barrel: the barrel also
// pulls the API middlewares, and with them the KV provider and the broadcast
// and RBAC SDKs, into a transport that needs none of them.
import { Middleware as OperatorSecretMiddleware } from "@sps/middlewares/operator-secret";

@injectable()
export class Controller {
  service: Service;
  httpRoutes: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    handler: (c: Context, next: any) => Promise<Response>;
    middlewares?: MiddlewareHandler[];
  }[];
  telegramBot: TelegarmBot;

  constructor(service: Service, telegramBot: TelegarmBot) {
    this.service = service;
    this.telegramBot = telegramBot;

    const operatorSecret = new OperatorSecretMiddleware();

    this.bindHttpRoutes([
      {
        method: "POST",
        path: "/",
        // No operator credential here: the webhook is authenticated by the
        // secret token Telegram returns on every delivery, checked inside the
        // grammY handler.
        handler: this.webhook,
      },
      {
        method: "POST",
        path: "/run",
        handler: this.run,
        middlewares: [operatorSecret.init()],
      },
      {
        method: "POST",
        path: "/stop",
        handler: this.stop,
        middlewares: [operatorSecret.init()],
      },
    ]);
  }

  async webhook(c: Context): Promise<Response> {
    if (this.telegramBot.instance) {
      return await this.telegramBot.webhookHandler(c);
    }

    throw new HTTPException(400, {
      message: "Telegram bot is not running",
    });
  }

  async run(c: Context): Promise<Response> {
    if (!this.telegramBot.instance) {
      throw new HTTPException(400, {
        message: "Telegram bot is not running",
      });
    }

    const result = await this.telegramBot.run();

    return c.json({
      ok: result,
    });
  }

  async stop(c: Context): Promise<Response> {
    if (!this.telegramBot.instance) {
      throw new HTTPException(400, {
        message: "Telegram bot is not running",
      });
    }

    const result = await this.telegramBot.stop();

    return c.json({
      ok: result,
    });
  }

  protected bindHttpRoutes(routes: Controller["httpRoutes"]) {
    this.httpRoutes = [];

    for (const route of routes) {
      const handler = route.handler.bind(this);
      this.httpRoutes.push({
        ...route,
        handler,
      });
    }
  }
}
