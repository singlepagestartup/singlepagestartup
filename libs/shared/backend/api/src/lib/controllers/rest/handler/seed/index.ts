import "reflect-metadata";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Next } from "hono/types";
import { inject, injectable } from "inversify";
import { type IService } from "../../../../service";
import { DI } from "../../../../di/constants";

@injectable()
export class Handler<
  C extends Context,
  SCHEMA extends Record<string, unknown>,
> {
  service: IService<SCHEMA>;

  constructor(@inject(DI.IService) service: IService<SCHEMA>) {
    this.service = service;
  }

  async execute(c: C, next: Next) {
    try {
      const result = await this.service.seed();

      return c.json({
        data: result,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
