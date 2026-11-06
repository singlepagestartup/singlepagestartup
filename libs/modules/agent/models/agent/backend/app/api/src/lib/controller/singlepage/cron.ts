import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context, next: any): Promise<Response> {
    try {
      await this.service.cronQueue.tick();
      return c.body(null, 204);
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
