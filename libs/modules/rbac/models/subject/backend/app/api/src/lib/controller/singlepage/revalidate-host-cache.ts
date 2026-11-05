import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context) {
    try {
      await this.service.revalidateHostCache();
    } catch (error) {
      throw new HTTPException(502, {
        message: "Host cache invalidation failed",
        cause: error,
      });
    }

    return c.json({ data: { ok: true } });
  }
}
