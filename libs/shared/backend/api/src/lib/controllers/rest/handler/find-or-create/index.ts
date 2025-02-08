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
  constructor(@inject(DI.IService) private service: IService<SCHEMA>) {}

  async execute(c: C, next: Next) {
    try {
      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new HTTPException(422, {
          message:
            "Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        });
      }

      const data = JSON.parse(body["data"]);

      const { entity, statusCode } = await this.service.findOrCreate({ data });

      return c.json(
        {
          data: entity,
        },
        statusCode,
      );
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
