import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service as CheckPayment } from "../../../../../../service/singlepage/ecommerce/order/payment-check";

export class Handler {
  constructor(private readonly check: CheckPayment) {}

  async execute(c: Context, next: unknown): Promise<Response> {
    try {
      const id = c.req.param("uuid");
      if (!id) {
        throw new Error("Validation error. Invalid id");
      }
      const body = await c.req.parseBody();
      if (typeof body.data !== "string" || !JSON.parse(body.data)) {
        throw new Error("Validation error. Invalid data");
      }
      const result = await this.check.execute(id);
      return c.json({ data: result });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
