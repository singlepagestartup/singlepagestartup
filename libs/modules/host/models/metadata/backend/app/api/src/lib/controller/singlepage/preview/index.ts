import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { seoPreviewSchema } from "@sps/host/models/metadata/sdk/model";
import type { Service } from "../../../service";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    c.header("Cache-Control", "no-store");
    c.header("X-Robots-Tag", "noindex");
    try {
      const body = await c.req.text();
      if (new TextEncoder().encode(body).length > 65536)
        throw new HTTPException(413, { message: "Preview is too large" });
      const parsed = seoPreviewSchema.safeParse(JSON.parse(body));
      if (!parsed.success)
        throw new HTTPException(400, {
          message: parsed.error.issues[0].message,
        });
      return c.json({ data: await this.service.seo.preview(parsed.data) });
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      if (error instanceof SyntaxError)
        throw new HTTPException(400, { message: "Invalid JSON" });
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status >= 500 ? 503 : status, {
        message: status >= 500 ? "Preview is temporarily unavailable" : message,
        cause: details,
      });
    }
  }
}
