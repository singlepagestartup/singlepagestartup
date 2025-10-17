import "reflect-metadata";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Next } from "hono/types";
import { inject, injectable } from "inversify";
import { DI } from "../../../../di/constants";
import { type IService } from "../../../../service";
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

      if (!uuid) {
        throw new Error("Invalid id. Got: " + uuid);
      }

      const data = await this.service.findById({ id: uuid });

      if (!data || !Object.keys(data).length) {
        throw new Error("Not Found entity with id: " + uuid);
      }

      return c.json({
        data,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
