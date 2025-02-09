import { Context } from "hono";
import { Service } from "../../service";
import { deleteCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const data = await this.service.logout();

      deleteCookie(c, "rbac.subject.jwt");

      return c.json({
        data,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
