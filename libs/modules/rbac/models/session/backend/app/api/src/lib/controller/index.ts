import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, type IService, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/session/backend/repository/database";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  constructor(
    @inject(DI.IService) service: IService<(typeof Table)["$inferSelect"]>,
  ) {
    super(service);
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/init",
        handler: this.init,
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

  public async init(c: Context, next: any): Promise<Response> {
    try {
      return c.json({
        ok: true,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
