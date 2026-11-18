import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service as Dispatch } from "../../../../../../service/singlepage/ecommerce/order/payment-dispatch";

export class Handler {
  constructor(private readonly dispatch: Dispatch) {}

  async execute(c: Context, next: unknown): Promise<Response> {
    try {
      const id = c.req.param("uuid");
      const provider = c.req.param("provider");
      if (!id || !provider) {
        throw new Error("Validation error. Missing payment intent or provider");
      }
      const body = await c.req.parseBody();
      if (typeof body.data !== "string") {
        throw new Error("Validation error. Invalid data");
      }
      const data = JSON.parse(body.data);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Validation error. Invalid data");
      }
      const result = await this.dispatch.execute(id, provider, data);
      return c.json({ data: result }, 201);
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
