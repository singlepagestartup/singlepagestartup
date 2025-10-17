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
    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new Error(
        "Invalid body['data']: " +
          body["data"] +
          ". Expected string, got: " +
          typeof body["data"],
      );
    }

    try {
      const data = JSON.parse(body["data"]);

      const entity = await this.service.create({ data });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
