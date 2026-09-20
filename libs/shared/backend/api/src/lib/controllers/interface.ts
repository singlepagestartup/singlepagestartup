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
  /**
   * Marks a route only an operator holding the RBAC secret may call. Routes
   * that are never anonymous default to true when they are bound; a project
   * that must re-open one sets it to false deliberately (issue #276).
   */
  requiresSecret?: boolean;
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
  count: (c: Context, next: any) => Response | Promise<Response>;
  findById: (c: Context, next: any) => Response | Promise<Response>;
  create: (c: Context, next: any) => Response | Promise<Response>;
  update: (c: Context, next: any) => Response | Promise<Response>;
  delete: (c: Context, next: any) => Response | Promise<Response>;
  dump: (c: Context, next: any) => Response | Promise<Response>;
  seed: (c: Context, next: any) => Response | Promise<Response>;
}
