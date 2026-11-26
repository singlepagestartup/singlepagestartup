import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../service";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context) {
    try {
      const id = c.req.param("uuid");
      if (id) {
        const file = await this.service.findById({ id });
        if (!file || (await this.service.isProtectedPublicReceipt(file))) {
          throw new Error("Not Found error. File not found");
        }
        return c.json({ data: file });
      }
      const data = await this.service.publicMetadata({
        params: c.var.parsedQuery,
      });
      return c.json({ data });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
