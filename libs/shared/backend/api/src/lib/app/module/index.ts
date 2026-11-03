import "reflect-metadata";
import { Hono, type Env } from "hono";
import { inject, injectable, unmanaged } from "inversify";
import { DI } from "../../di/constants";
import type { IExceptionFilter } from "../../filters";
import type { IDumpResult, ISeedResult } from "../../configuration";
import type { IAppRouteDescription } from "../default/interface";
import type { IApp, IModuleApps } from "./interface";

export type { IApp, IModuleApps, IModuleAppEntry } from "./interface";

@injectable()
export class App<APPS extends IModuleApps = IModuleApps, ENV extends Env = Env>
  implements IApp<APPS, ENV>
{
  hono: Hono<ENV>;
  apps!: APPS;

  constructor(
    @inject(DI.IExceptionFilter) readonly exceptionFilter: IExceptionFilter,
    @unmanaged() private readonly createApps: () => APPS,
  ) {
    this.hono = new Hono<ENV>();
  }

  async init(): Promise<void> {
    this.apps = this.createApps();
    await this.configureApps();
    this.useRoutes();
    this.hono.onError(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  protected configureApps(): void | Promise<void> {}

  describeRoutes(): IAppRouteDescription[] {
    return this.apps.apps.flatMap(({ route, app }) =>
      app
        .describeRoutes()
        .map((entry) => ({ ...entry, route: route + entry.route })),
    );
  }

  useRoutes(): void {
    this.apps.apps.forEach(({ route, app }) =>
      this.hono.route(route, app.hono),
    );
  }

  async dump(props?: {
    type?: "model" | "relation";
    dumps: IDumpResult[];
  }): Promise<IDumpResult[]> {
    const dumps: IDumpResult[] = [];
    await Promise.all(
      this.apps.apps.map(async ({ type, app }) => {
        if (type !== props?.type) return;
        const result = await app.dump();
        dumps.push(...(Array.isArray(result) ? result : [result]));
      }),
    );
    return dumps;
  }

  async seed(props?: {
    type?: "model" | "relation";
    seeds: ISeedResult[];
  }): Promise<ISeedResult[]> {
    const seeds: ISeedResult[] = [];
    await Promise.all(
      this.apps.apps.map(async ({ type, app }) => {
        if (type !== props?.type) return;
        const result = await app.seed(props);
        seeds.push(...(Array.isArray(result) ? result : [result]));
      }),
    );
    return seeds;
  }
}
