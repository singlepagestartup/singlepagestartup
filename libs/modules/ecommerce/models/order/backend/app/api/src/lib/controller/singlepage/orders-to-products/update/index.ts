import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC secret key not found");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. Invalid id. Got: " + id);
      }

      const orderToProductId = c.req.param("orderToProductId");

      if (!orderToProductId) {
        throw new Error(
          "Validation error. Invalid orderToProductId. Got: " +
            orderToProductId,
        );
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);

      let entity = await this.service.findById({ id });

      if (!entity) {
        throw new Error("Not Found error. Order not found");
      }

      const orderToProduct = await ordersToProductsApi.findById({
        id: orderToProductId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!orderToProduct) {
        throw new Error("Not Found error. Order to product not found");
      }

      const result = await ordersToProductsApi.update({
        id: orderToProduct.id,
        data,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: result,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
