import "reflect-metadata";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Next } from "hono/types";
import { inject, injectable } from "inversify";
import { DI } from "../../../../di/constants";
import { type IService } from "../../../../service";
import { type IParseQueryMiddlewareGeneric } from "../../../../middleware";

@injectable()
export class Handler<
  C extends Context,
  SCHEMA extends Record<string, unknown>,
> {
  constructor(@inject(DI.IService) private service: IService<SCHEMA>) {}

  async execute(
    c: Context<IParseQueryMiddlewareGeneric>,
    next: Next,
  ): Promise<Response> {
    try {
      const data = await this.service.find({ params: c.var.parsedQuery });

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
