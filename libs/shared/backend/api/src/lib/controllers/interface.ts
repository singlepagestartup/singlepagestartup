import { Context, Handler } from "hono";
import { createMiddleware } from "hono/factory";
import { BlankInput, HandlerResponse } from "hono/types";
import { IService } from "../service";
import {
  Middleware as GrammyMiddleware,
  Context as GrammyContext,
} from "grammy";
import {
  ConversationFlavor as GrammyConversationFlavor,
  Conversation as GrammyConversation,
} from "@grammyjs/conversations";

export interface IHttpRoute {
  path: string;
  handler: Handler<any, string, BlankInput, HandlerResponse<any>>;
  method: "GET" | "POST" | "DELETE" | "PATCH";
  middlewares?: ReturnType<typeof createMiddleware>[];
}

export interface IRoute extends IHttpRoute {}

export interface ITelegramRoute {
  path: string;
  handler: GrammyMiddleware;
}

export interface ITelegramConversation {
  path: string;
  handler: (
    conversation: GrammyConversation<any>,
    ctx: GrammyContext & GrammyConversationFlavor,
  ) => void;
}

export interface IController<DTO extends Record<string, unknown>> {
  service: IService<DTO>;
  httpRoutes: IRoute[];
  telegramRoutes: ITelegramRoute[];
  telegramConversations: ITelegramConversation[];
  find: (c: Context, next: any) => Response | Promise<Response>;
  findById: (c: Context, next: any) => Response | Promise<Response>;
  create: (c: Context, next: any) => Response | Promise<Response>;
  update: (c: Context, next: any) => Response | Promise<Response>;
  delete: (c: Context, next: any) => Response | Promise<Response>;
  dump: (c: Context, next: any) => Response | Promise<Response>;
  seed: (c: Context, next: any) => Response | Promise<Response>;
}
