import { Context, Handler } from "hono";
import { createMiddleware } from "hono/factory";
import { BlankInput, HandlerResponse } from "hono/types";
import { IService } from "../service";
import { Middleware } from "grammy";

export interface IHttpRoute {
  path: string;
  handler: Handler<any, string, BlankInput, HandlerResponse<any>>;
  method: "GET" | "POST" | "DELETE" | "PATCH";
  middlewares?: ReturnType<typeof createMiddleware>[];
}

export interface IRoute extends IHttpRoute {}

export interface ITelegramRoute {
  path: string;
  handler: Middleware;
}

export interface IController<DTO extends Record<string, unknown>> {
  service: IService<DTO>;
  routes: IRoute[];
  httpRoutes: IRoute[];
  telegramRoutes: ITelegramRoute[];
  find: (c: Context, next: any) => Response | Promise<Response>;
  findById: (c: Context, next: any) => Response | Promise<Response>;
  create: (c: Context, next: any) => Response | Promise<Response>;
  update: (c: Context, next: any) => Response | Promise<Response>;
  delete: (c: Context, next: any) => Response | Promise<Response>;
  dump: (c: Context, next: any) => Response | Promise<Response>;
  seed: (c: Context, next: any) => Response | Promise<Response>;
}
