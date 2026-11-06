import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../service";

export class Handler {
  constructor(private readonly service: Service) {}
  async execute(c: Context): Promise<Response> {
    try {
      return c.json({
        data: await this.service.publicResourceIds({
          resource: c.req.query("resource")!,
        }),
      });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
