import "reflect-metadata";
import { inject, injectable } from "inversify";
import { Service } from "./service";
import { Context } from "hono";
import { DI } from "@sps/shared-backend-api";
import { Bot } from "./bot";

@injectable()
export class Controller {
  service: Service;
  routes: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    handler: (c: Context, next: any) => Promise<Response>;
  }[];
  bot: Bot;

  constructor(
    @inject(DI.IService) service: Service,
    @inject(DI.ITelegramBot) bot: Bot,
  ) {
    this.service = service;
    this.bot = bot;
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
    return await this.bot.webhookHandler(c);
  }

  async run(c: Context): Promise<Response> {
    const result = await this.bot.run();

    return c.json({
      ok: result,
    });
  }

  async stop(c: Context): Promise<Response> {
    const result = await this.bot.stop();

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
