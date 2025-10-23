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
          "Validation error. Invalid data, should be array [{'id':'<string>','data':<any>},...]",
        );
      }

      const updatedEntities: SCHEMA[] = [];

      for (const dataEntity of data) {
        if (typeof dataEntity["id"] !== "string") {
          throw new Error("Validation error. Invalid id");
        }

        if (typeof dataEntity["data"] !== "object") {
          throw new Error("Validation error. Invalid data");
        }

        const updatedEntity = await this.service.update({
          id: dataEntity["id"],
          data: dataEntity["data"],
        });

        if (!updatedEntity) {
          throw new Error("Not Found error. Entity not found");
        }

        updatedEntities.push(updatedEntity);
      }

      return c.json({
        data: updatedEntities,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
