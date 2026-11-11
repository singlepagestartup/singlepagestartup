import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { z } from "zod";
import type { Service } from "../../../service";

export class Handler {
  constructor(private readonly service: Service) {}
  async execute(c: Context) {
    try {
      const id = z.uuid().safeParse(c.req.param("id"));
      if (!id.success) {
        throw new Error("Validation error. A relation UUID is required");
      }
      const data = await this.service.findWithMessage(id.data);
      return c.json({ data });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
