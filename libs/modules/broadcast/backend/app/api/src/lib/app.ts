import "reflect-metadata";
import { Env, Hono } from "hono";
import {
  DI,
  IDumpResult,
  ISeedResult,
  type IDefaultApp,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";

@injectable()
export class App implements IDefaultApp<Env> {
  hono: Hono<Env>;
  exceptionFilter: IExceptionFilter;
  apps: Apps;

  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    this.hono = new Hono<Env>();
    this.exceptionFilter = exceptionFilter;
  }

  public async init() {
    const apps = new Apps();
    this.apps = apps;

    this.useRoutes();
    this.hono.onError(this.exceptionFilter.catch.bind(this.exceptionFilter));
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

  useRoutes() {
    this.apps.apps.forEach((app) => {
      this.hono.route(app.route, app.app.hono);
    });
  }
}
