import type { Env, Hono } from "hono";
import type { IController } from "../../controllers";
import type { IExceptionFilter } from "../../filters";
import type { IDumpResult, ISeedResult } from "../../configuration";
import type { IResourceDescription } from "../../repository/interface";

export interface IApp<
  ENV extends Env = {},
  SCHEMA extends Record<string, unknown> = {},
> {
  describeRoutes: () => IAppRouteDescription[];
  hono: Hono<ENV>;
  controller?: IController<SCHEMA>;
  exceptionFilter: IExceptionFilter;
  init: () => Promise<void>;
  useRoutes: () => void;
  seed: (props?: {
    type?: "model" | "relation";
    seeds: ISeedResult[];
  }) => Promise<ISeedResult | ISeedResult[]>;
  dump: (props?: {
    type?: "model" | "relation";
    dumps: IDumpResult[];
  }) => Promise<IDumpResult | IDumpResult[]>;
}

export interface IAppRouteDescription {
  route: string;
  resource: IResourceDescription;
}
