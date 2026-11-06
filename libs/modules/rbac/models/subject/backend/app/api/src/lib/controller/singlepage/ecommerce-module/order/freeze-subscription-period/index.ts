import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../../../service";
export class Handler {
  constructor(readonly service: Service) {}
  async execute(c: Context): Promise<Response> {
    try {
      const id = c.req.param("id"),
        ecommerceModuleOrderId = c.req.param("ecommerceModuleOrderId");
      if (!id || !ecommerceModuleOrderId)
        throw new Error("Validation error. Subject and order IDs required");
      const body = await c.req.parseBody();
      if (typeof body.data !== "string")
        throw new Error("Validation error. Freeze expectation required");
      const data = JSON.parse(body.data);
      if (typeof data.expectedUpdatedAt !== "string")
        throw new Error(
          "Validation error. Expected updated timestamp required",
        );
      return c.json({
        data: await this.service.ecommerceModuleOrderFreezeSubscriptionPeriod({
          id,
          ecommerceModuleOrderId,
          data: { expectedUpdatedAt: data.expectedUpdatedAt },
        }),
      });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
