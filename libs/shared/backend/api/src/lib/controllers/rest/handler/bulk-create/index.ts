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
        throw new HTTPException(400, {
          message: "Invalid data",
        });
      }

      const data = JSON.parse(body["data"]);

      if (!data.length) {
        throw new HTTPException(400, {
          message: "Invalid data, should be array [{'data':<any>},...]",
        });
      }

      const createdEntities: SCHEMA[] = [];

      for (const dataEntity of data) {
        if (typeof dataEntity["data"] !== "object") {
          throw new HTTPException(400, {
            message: "Invalid data",
          });
        }

        const createdEntity = await this.service.create({
          data: dataEntity["data"],
        });

        if (!createdEntity) {
          throw new HTTPException(404, {
            message: "Entity not found",
          });
        }

        createdEntities.push(createdEntity);
      }

      return c.json({
        data: createdEntities,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
