import "reflect-metadata";
import { Env, Hono } from "hono";
import {
  DI,
  IDumpResult,
  ISeedResult,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Apps } from "./apps";
import { TelegarmBot } from "./telegram-bot";
import { Middleware, Context as GrammyContext } from "grammy";
import { Service } from "./service";
import {
  Conversation,
  ConversationFlavor as GrammyConversationFlavor,
} from "@grammyjs/conversations";
import { app as pageApp } from "@sps/telegram/models/page/backend/app/api";
import { logger } from "@sps/backend-utils";

@injectable()
export class App {
  hono: Hono<Env>;
  exceptionFilter: IExceptionFilter;
  controller: Controller;
  apps: Apps;
  telegramBot: TelegarmBot;

  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    this.hono = new Hono<Env>();
    this.exceptionFilter = exceptionFilter;

    this.telegramBot = new TelegarmBot();
    const service = new Service();
    this.controller = new Controller(service, this.telegramBot);
  }

  public async init() {
    const apps = new Apps();
    this.apps = apps;
    this.hono.onError(this.exceptionFilter.catch.bind(this.exceptionFilter));
    this.useHttpRoutes();
    await this.useTelegamRoutes();
  }

  async dump(props?: { type?: "model" | "relation"; dumps: IDumpResult[] }) {
    const dumps: IDumpResult[] = [];

    await Promise.all(
      this.apps.apps.map(async (app) => {
        if (app.type === props?.type) {
          const appDumps = await app.app.dump();

          dumps.push(appDumps);
        }
      }),
    );

    return dumps;
  }

  async seed(props?: { type?: "model" | "relation"; seeds: ISeedResult[] }) {
    const seeds: ISeedResult[] = [];

    await Promise.all(
      this.apps.apps.map(async (app) => {
        if (app.type === props?.type) {
          const appSeeds = await app.app.seed(props);

          seeds.push(appSeeds);
        }
      }),
    );

    return seeds;
  }

  useHttpRoutes() {
    this.controller.httpRroutes.map((route) => {
      this.hono.on(route.method, route.path, route.handler);
    });
    this.apps.apps.forEach((app) => {
      this.hono.route(app.route, app.app.hono);
    });
  }

  async useTelegamRoutes() {
    if (!this.telegramBot.instance) {
      return;
    }

    const telegramRoutes: { path: string; handler: Middleware }[] = [];
    const telegramConversations: {
      path: string;
      handler: (
        conversation: Conversation<any>,
        ctx: GrammyContext & GrammyConversationFlavor,
      ) => void;
    }[] = [];

    this.apps.apps.forEach((app) => {
      app.app.controller.telegramRoutes?.map((route) => {
        telegramRoutes.push({
          path: route.path,
          handler: route.handler,
        });
      });
      app.app.controller.telegramConversations?.map((conversation) => {
        telegramConversations.push({
          path: conversation.path,
          handler: conversation.handler,
        });
      });
    });

    const commands = await pageApp.controller.telegramCommands();
    logger.debug("🚀 ~ useTelegamRoutes ~ commands:", commands);

    this.telegramBot.addRoutes(telegramRoutes);
    this.telegramBot.addConversations(telegramConversations);
    this.telegramBot.init();
  }
}
