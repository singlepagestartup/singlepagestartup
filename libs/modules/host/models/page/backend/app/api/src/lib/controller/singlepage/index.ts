import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/host/models/page/backend/repository/database";
import { Context } from "hono";
import { Service } from "../../service";
import { Handler as FindByUrl } from "./find-by-url";
import { Handler as UrlSegmentValue } from "./url-segment-value";
import { Handler as Urls } from "./urls";
import { Handler as Seo } from "./seo";
import { Handler as SeoPreview } from "./preview";
import type { IRouteSource } from "../../service/singlepage/routing";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/seo",
        handler: (c) => new Seo(this.service).execute(c),
      },
      {
        method: "POST",
        path: "/seo-preview",
        handler: (c) => new SeoPreview(this.service).execute(c),
      },
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/find-by-url",
        handler: this.findByUrl,
      },
      {
        method: "GET",
        path: "/urls",
        handler: this.urls,
      },
      {
        method: "GET",
        path: "/url-segment-value",
        handler: this.urlSegmentValue,
      },
      {
        method: "GET",
        path: "/count",
        handler: this.count,
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
  }

  configureRouting(sources: IRouteSource[]) {
    this.service.configureRouting(sources);
  }

  async findByUrl(c: Context, next: any): Promise<Response> {
    return new FindByUrl(this.service).execute(c, next);
  }

  async urls(c: Context, next: any): Promise<Response> {
    return new Urls(this.service).execute(c, next);
  }

  async urlSegmentValue(c: Context, next: any): Promise<Response> {
    return new UrlSegmentValue(this.service).execute(c, next);
  }
}
