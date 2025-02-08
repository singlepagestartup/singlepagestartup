import "reflect-metadata";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Next } from "hono/types";
import { inject, injectable } from "inversify";
import { DI } from "../../../../di/constants";
import { type IService } from "../../../../service";

@injectable()
export class Handler<
  C extends Context,
  SCHEMA extends Record<string, unknown>,
> {
  constructor(@inject(DI.IService) private service: IService<SCHEMA>) {}

  async execute(c: C, next: Next) {
    try {
      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new HTTPException(400, {
          message: "Invalid id. Got: " + uuid,
        });
      }

      const data = await this.service.findById({ id: uuid });

      if (!data || !Object.keys(data).length) {
        throw new HTTPException(404, {
          message: "Not Found entity with id: " + uuid,
        });
      }

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
