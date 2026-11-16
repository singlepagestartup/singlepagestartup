import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../../../service";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context, next: unknown): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      const orderId = c.req.param("orderId");
      if (!subjectId || !orderId) {
        throw new Error("Validation error. Subject and order IDs are required");
      }
      const result = await this.service.ecommerceModuleOrderRepeat({
        subjectId,
        orderId,
      });
      return c.json({ data: result });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
