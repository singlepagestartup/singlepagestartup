import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/host/models/metadata/backend/repository/database";
import type { Context } from "hono";
import { Service } from "../../service";
import { Handler as Preview } from "./preview";
import { Handler as Seo } from "./seo";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  declare service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.bindHttpRoutes([
      { method: "GET", path: "/seo", handler: this.seo },
      { method: "POST", path: "/preview", handler: this.preview },
      ...this.httpRoutes,
    ]);
  }

  async preview(c: Context): Promise<Response> {
    return new Preview(this.service).execute(c);
  }

  async seo(c: Context): Promise<Response> {
    return new Seo(this.service).execute(c);
  }
}
