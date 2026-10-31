import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { seoResolveSchema } from "@sps/host/models/page/sdk/model";
import type { Service } from "../../../service";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const parsed = seoResolveSchema.safeParse(c.req.query());
      if (!parsed.success)
        throw new HTTPException(400, {
          message: parsed.error.issues[0].message,
        });
      return c.json({
        data: await this.service.seo.resolve(parsed.data.url),
      });
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
