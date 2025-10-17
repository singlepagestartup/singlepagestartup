import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/identity/backend/repository/database";
import { Service } from "../../service";
import { Context } from "hono";
import { Handler as ChangePassword } from "./change-password";
import { Handler as EmailAndPassword } from "./email-and-password";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
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
      {
        method: "POST",
        path: "/email-and-password",
        handler: this.emailAndPassword,
      },
      {
        method: "PATCH",
        path: "/:uuid/change-password",
        handler: this.changePassword,
      },
    ]);
  }

  async emailAndPassword(c: Context, next: any): Promise<Response> {
    return new EmailAndPassword(this.service).execute(c, next);
  }

  async changePassword(c: Context, next: any): Promise<Response> {
    return new ChangePassword(this.service).execute(c, next);
  }
}
