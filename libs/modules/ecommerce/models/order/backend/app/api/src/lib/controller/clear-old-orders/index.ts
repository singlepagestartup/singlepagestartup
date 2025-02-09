import { Context } from "hono";
import { Service } from "../../service";
import { HTTPException } from "hono/http-exception";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      await this.service.clearOldOrders({});

      return c.json({
        data: {
          ok: true,
        },
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal server error",
        cause: error,
      });
    }
  }
}
