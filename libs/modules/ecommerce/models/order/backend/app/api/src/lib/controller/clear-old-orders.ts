import { Context } from "hono";
import { Service } from "../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    await this.service.clearOldOrders({});

    return c.json({
      data: {
        ok: true,
      },
    });
  }
}
