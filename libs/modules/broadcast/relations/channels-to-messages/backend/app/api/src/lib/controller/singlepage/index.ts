import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import type { Context } from "hono";
import type { ISelectSchema } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";
import { Service } from "../../service";
import { Handler as Message } from "./message";

@injectable()
export class Controller extends RESTController<ISelectSchema> {
  declare service: Service;
  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.bindHttpRoutes([
      { method: "GET", path: "/:id/message", handler: this.message },
      ...this.httpRoutes,
    ]);
  }
  message(c: Context) {
    return new Message(this.service).execute(c);
  }
}
