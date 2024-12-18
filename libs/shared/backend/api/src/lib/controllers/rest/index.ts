import "reflect-metadata";
import { Context } from "hono";
import { inject, injectable } from "inversify";
import {
  FindHandler,
  FindByIdHandler,
  CreateHandler,
  UpdateHandler,
  DeleteHandler,
  DumpHandler,
  SeedHandler,
  FindOrCreateHandler,
} from "./handler";
import { type IService } from "../../service";
import { DI } from "../../di/constants";
import { IController } from "../interface";

@injectable()
export class Controller<DTO extends Record<string, unknown>>
  implements IController<DTO>
{
  service: IService<DTO>;
  routes: IController<DTO>["routes"] = [];
  httpRoutes: IController<DTO>["httpRoutes"] = [];
  telegramRoutes: IController<DTO>["telegramRoutes"];
  telegramConversations: IController<DTO>["telegramConversations"];

  constructor(@inject(DI.IService) service: IService<DTO>) {
    this.service = service;
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/dump",
        handler: this.dump,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "POST",
        path: "/find-or-create",
        handler: this.findOrCreate,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
    ]);
    this.bindRoutes(this.httpRoutes);
  }

  public async find(c: Context, next: any): Promise<Response> {
    const handler = new FindHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  public async findById(c: Context, next: any): Promise<Response> {
    const handler = new FindByIdHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  public async create(c: Context, next: any): Promise<Response> {
    const handler = new CreateHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  public async findOrCreate(c: Context, next: any): Promise<Response> {
    const handler = new FindOrCreateHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  public async update(c: Context, next: any): Promise<Response> {
    const handler = new UpdateHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  public async delete(c: Context, next: any): Promise<Response> {
    const handler = new DeleteHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  public async dump(c: Context, next: any): Promise<Response> {
    const handler = new DumpHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  public async seed(c: Context, next: any): Promise<Response> {
    const handler = new SeedHandler<Context, DTO>(this.service);
    return handler.execute(c, next);
  }

  protected bindHttpRoutes(routes: IController<DTO>["routes"]) {
    this.httpRoutes = [];

    for (const route of routes) {
      const handler = route.handler.bind(this);
      this.httpRoutes.push({
        ...route,
        handler,
      });
    }
  }

  /**
   * @deprecated Use bindHttpRoutes instead
   */
  protected bindRoutes(routes: IController<DTO>["routes"]) {
    this.bindHttpRoutes(routes);
    this.routes = this.httpRoutes;
  }

  protected bindTelegramRoutes(routes: IController<DTO>["telegramRoutes"]) {
    this.telegramRoutes = [];

    for (const route of routes) {
      const handler = (route.handler as unknown as Function).bind(this);
      this.telegramRoutes.push({
        ...route,
        handler: handler as IController<DTO>["telegramRoutes"][0]["handler"],
      });
    }
  }

  protected bindTelegramConversations(
    routes: IController<DTO>["telegramConversations"],
  ) {
    this.telegramConversations = [];

    for (const route of routes) {
      const handler = (route.handler as unknown as Function).bind(this);
      this.telegramConversations.push({
        ...route,
        handler:
          handler as IController<DTO>["telegramConversations"][0]["handler"],
      });
    }
  }
}
