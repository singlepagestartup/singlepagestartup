import type { Env } from "hono";
import type { IApp as IDefaultApp } from "../default/interface";

export interface IModuleAppEntry {
  type: "model" | "relation";
  route: string;
  app: Pick<IDefaultApp, "hono" | "describeRoutes" | "dump" | "seed">;
}

export interface IModuleApps {
  apps: IModuleAppEntry[];
}

export interface IApp<
  APPS extends IModuleApps = IModuleApps,
  ENV extends Env = Env,
> extends IDefaultApp<ENV> {
  apps: APPS;
}
