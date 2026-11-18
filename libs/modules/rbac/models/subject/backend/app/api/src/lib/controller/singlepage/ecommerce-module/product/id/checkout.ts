import {
  RBAC_SECRET_KEY,
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { ecommerceProductCheckoutSchema } from "@sps/rbac/models/subject/sdk/model";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const productId = c.req.param("productId");

      if (!productId) {
        throw new Error("Validation error. No productId provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(body["data"]);
      } catch {
        throw new Error("Validation error. Invalid product checkout JSON");
      }
      const parsed = ecommerceProductCheckoutSchema.safeParse(parsedBody);
      if (!parsed.success) {
        if (parsed.error.issues.some((issue) => issue.path[0] === "quantity")) {
          throw new Error(
            `Validation error. Quantity must be an integer between ${quantityBounds.min} and ${quantityBounds.max}`,
          );
        }
        throw new Error("Validation error. Invalid product purchase selection");
      }

      const result = await this.service.ecommerceProductCheckout({
        id,
        productId,
        data: parsed.data,
      });

      return c.json({ data: result });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
