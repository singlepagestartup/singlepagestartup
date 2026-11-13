import type { Context } from "hono";
import type { Service } from "../../service";

export class Handler {
  constructor(private service: Service) {}

  async execute(c: Context) {
    const data = await this.service.permissionDefaults();
    c.header("Cache-Control", "private, no-store");
    return c.json({ data });
  }
}
