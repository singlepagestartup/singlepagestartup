import { Context } from "hono";
import { Service } from "../../service";
import { deleteCookie } from "hono/cookie";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    const data = await this.service.logout();

    deleteCookie(c, "rbac.subject.jwt");

    return c.json({
      data,
    });
  }
}
