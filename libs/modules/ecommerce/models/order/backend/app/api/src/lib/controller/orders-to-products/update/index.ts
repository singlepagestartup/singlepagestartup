import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC secret key not found",
        });
      }

      const id = c.req.param("id");

      if (!id) {
        throw new HTTPException(400, {
          message: "Invalid id. Got: " + id,
        });
      }

      const orderToProductId = c.req.param("orderToProductId");

      if (!orderToProductId) {
        throw new HTTPException(400, {
          message: "Invalid orderToProductId. Got: " + orderToProductId,
        });
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return c.json(
          {
            message: "Invalid body",
          },
          {
            status: 400,
          },
        );
      }

      const data = JSON.parse(body["data"]);

      let entity = await this.service.findById({ id });

      if (!entity) {
        throw new HTTPException(404, {
          message: "Order not found",
        });
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
        throw new HTTPException(404, {
          message: "Order to product not found",
        });
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
      throw new HTTPException(500, {
        message: error.message || "Internal server error",
        cause: error,
      });
    }
  }
}
