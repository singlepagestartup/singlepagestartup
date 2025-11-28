import "reflect-metadata";
import { inject, injectable } from "inversify";
import {
  DefaultApp,
  DI,
  type IExceptionFilter,
  type ISeedResult,
  ParseQueryMiddleware,
} from "@sps/shared-backend-api";
import { Table } from "@sps/telegram/models/page/backend/repository/database";
import { Env, Hono } from "hono";
import { Controller } from "./controller";
import { Configuration } from "./configuration";

@injectable()
export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {
  hono: Hono<Env>;
  controller: Controller;
  exceptionFilter: IExceptionFilter;
  configuration: Configuration;

  constructor(
    @inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter,
    @inject(DI.IController) controller: Controller,
    @inject(DI.IConfiguration) configuration: Configuration,
  ) {
    super(exceptionFilter, controller, configuration);
    this.hono = new Hono<Env>();
    this.exceptionFilter = exceptionFilter;
    this.controller = controller;
    this.configuration = configuration;
  }

  public async init() {
    this.hono.onError(this.exceptionFilter.catch.bind(this.exceptionFilter));
    this.hono.use(new ParseQueryMiddleware().init());
    this.useRoutes();
  }

  async dump() {
    const dumpResult = await this.controller.service.dump();

    return dumpResult;
  }

  async seed(props?: { seeds: ISeedResult[] }): Promise<ISeedResult> {
    const seedResult = await this.controller.service.seed(props);

    return seedResult;
  }

  useRoutes() {
    this.controller.httpRoutes.map((route) => {
      if (route.middlewares) {
        route.middlewares.forEach((middleware) => {
          this.hono.use(route.path, middleware);
        });
      }

      this.hono.on(route.method, route.path, route.handler);
    });
  }
}
