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

@injectable()
export class App {
  hono: Hono<Env>;
  exceptionFilter: IExceptionFilter;
  controller: Controller;
  apps: Apps;

  constructor(
    @inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter,
    @inject(DI.IController) controller: Controller,
  ) {
    this.hono = new Hono<Env>();
    this.exceptionFilter = exceptionFilter;
    this.controller = controller;
  }

  public async init() {
    const apps = new Apps();
    this.apps = apps;
    this.hono.onError(this.exceptionFilter.catch.bind(this.exceptionFilter));
    this.useRoutes();
  }

  async dump(props?: { type?: "model" | "relation"; dumps: IDumpResult[] }) {
    const dumps: IDumpResult[] = [];

    await Promise.all(
      this.apps.apps.map(async (app) => {
        if (app.type === props?.type) {
          const appDumps = await app.app.dump(props);

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

  useRoutes() {
    this.controller.routes.map((route) => {
      this.hono.on(route.method, route.path, route.handler);
    });
    this.apps.apps.forEach((app) => {
      this.hono.mount(app.route, app.app.hono.fetch);
    });
  }
}
