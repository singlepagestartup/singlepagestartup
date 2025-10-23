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
      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      if (!uuid) {
        throw new Error("Validation error. Invalid id. Got: " + uuid);
      }

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        );
      }

      const data = JSON.parse(body["data"]);

      const entity = await this.service.update({ id: uuid, data });

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
