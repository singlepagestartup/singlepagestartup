import "reflect-metadata";
import { injectable } from "inversify";
import { Service } from "./service";
import { Context } from "hono";
import { TelegarmBot } from "./telegram-bot";

@injectable()
export class Controller {
  service: Service;
  routes: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    handler: (c: Context, next: any) => Promise<Response>;
  }[];
  telegramBot: TelegarmBot;

  constructor(service: Service, telegramBot: TelegarmBot) {
    this.service = service;
    this.telegramBot = telegramBot;
    this.bindRoutes([
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
    return await this.telegramBot.webhookHandler(c);
  }

  async run(c: Context): Promise<Response> {
    const result = await this.telegramBot.run();

    return c.json({
      ok: result,
    });
  }

  async stop(c: Context): Promise<Response> {
    const result = await this.telegramBot.stop();

    return c.json({
      ok: result,
    });
  }

  protected bindRoutes(routes: Controller["routes"]) {
    this.routes = [];

    for (const route of routes) {
      const handler = route.handler.bind(this);
      this.routes.push({
        ...route,
        handler,
      });
    }
  }
}
