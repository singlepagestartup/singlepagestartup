import "reflect-metadata";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Next } from "hono/types";
import { inject, injectable } from "inversify";
import { type IService } from "../../../../service";
import { DI } from "../../../../di/constants";
import { getHttpErrorType } from "@sps/backend-utils";

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
        throw new Error("Validation error. Invalid data");
      }

      const data = JSON.parse(body["data"]);

      if (!data.length) {
        throw new Error(
          "Validation error. Invalid data, should be array [{'data':<any>},...]",
        );
      }

      const createdEntities: SCHEMA[] = [];

      for (const dataEntity of data) {
        if (typeof dataEntity["data"] !== "object") {
          throw new Error("Validation error. Invalid data");
        }

        const createdEntity = await this.service.create({
          data: dataEntity["data"],
        });

        if (!createdEntity) {
          throw new Error("Internal error. Entity not created");
        }

        createdEntities.push(createdEntity);
      }

      return c.json({
        data: createdEntities,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
