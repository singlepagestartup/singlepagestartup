import "reflect-metadata";
import { injectable } from "inversify";
import { Service } from "./service";
import { Context } from "hono";
import { TelegarmBot } from "./telegram-bot";
import { HTTPException } from "hono/http-exception";

@injectable()
export class Controller {
  service: Service;
  httpRroutes: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    handler: (c: Context, next: any) => Promise<Response>;
  }[];
  telegramBot: TelegarmBot;

  constructor(service: Service, telegramBot: TelegarmBot) {
    this.service = service;
    this.telegramBot = telegramBot;
    this.bindHttpRoutes([
      {
        method: "POST",
        path: "/",
        handler: this.webhook,
      },
      {
        method: "POST",
        path: "/run",
        handler: this.run,
      },
      {
        method: "POST",
        path: "/stop",
        handler: this.stop,
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

  protected bindHttpRoutes(routes: Controller["httpRroutes"]) {
    this.httpRroutes = [];

    for (const route of routes) {
      const handler = route.handler.bind(this);
      this.httpRroutes.push({
        ...route,
        handler,
      });
    }
  }
}
