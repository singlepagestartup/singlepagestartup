import "reflect-metadata";
import { Hono, type Env } from "hono";
import { inject, injectable, unmanaged } from "inversify";
import { DI } from "../../di/constants";
import type { IExceptionFilter } from "../../filters";
import type { IDumpResult, ISeedResult } from "../../configuration";
import {
  defaultAppAssembly,
  getOwningAssembly,
  type IAppAssembly,
  type IAppBootstrap,
} from "../bootstrap";
import type {
  IAppRouteDescription,
  IApp as IDefaultApp,
} from "../default/interface";
import type { IApp, IModuleApps, IModuleChildApp } from "./interface";

export type { IApp, IModuleApps, IModuleAppEntry } from "./interface";

export function describeModuleRoutes(
  registry: IModuleApps,
): IAppRouteDescription[] {
  return registry.apps.flatMap(({ route, app }) =>
    app
      .describeRoutes()
      .map((entry) => ({ ...entry, route: route + entry.route })),
  );
}

export function createModuleChildApp(
  owner: IAppBootstrap<IModuleChildApp, unknown>,
  assembly: IAppAssembly,
): IModuleChildApp {
  let started: IModuleChildApp | undefined;
  async function prepare() {
    const { app } = await owner.bootstrap(assembly);
    started = app;
    return app;
  }
  return {
    prepare,
    describeRoutes: () => owner.describeRoutes(assembly),
    get hono() {
      if (!started) {
        throw new Error("Initialize the module before mounting its routes");
      }
      return started.hono;
    },
    async dump(props) {
      const app = await prepare();
      return app.dump(props);
    },
    async seed(props) {
      const app = await prepare();
      return app.seed(props);
    },
  };
}

export function createModuleBootstrap<TApp extends IDefaultApp>(
  owner: IAppBootstrap<TApp, undefined>,
  createApps: (assembly: IAppAssembly) => IModuleApps,
): IAppBootstrap<TApp, undefined> {
  return {
    ...owner,
    describeRoutes(requestedAssembly = defaultAppAssembly) {
      const assembly = getOwningAssembly(owner, requestedAssembly);
      return describeModuleRoutes(assembly.getOrCreate(createApps));
    },
  };
}

@injectable()
export class App<
  APPS extends IModuleApps = IModuleApps,
  ENV extends Env = Env,
> implements IApp<APPS, ENV> {
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
    await Promise.all(
      this.apps.apps.map(async (entry) => {
        if (entry.app.prepare) {
          entry.app = await entry.app.prepare();
        }
      }),
    );
    await this.configureApps();
    this.useRoutes();
    this.hono.onError(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  protected configureApps(): void | Promise<void> {}

  describeRoutes(): IAppRouteDescription[] {
    return describeModuleRoutes(this.apps);
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
    const entries = this.apps.apps.filter(({ type }) => type === props?.type);
    if (props?.type === "relation") {
      // A relation may refer to another seeded relation, e.g. linked store offers.
      // Its transformers require the IDs produced earlier in registration order.
      for (const { app } of entries) {
        const result = await app.seed({
          ...props,
          seeds: [...props.seeds, ...seeds],
        });
        seeds.push(...(Array.isArray(result) ? result : [result]));
      }
    } else {
      const results = await Promise.all(
        entries.map(({ app }) => app.seed(props)),
      );
      for (const result of results)
        seeds.push(...(Array.isArray(result) ? result : [result]));
    }
    return seeds;
  }
}
