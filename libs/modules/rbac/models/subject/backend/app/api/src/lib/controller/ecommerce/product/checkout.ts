import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");
      if (!id) {
        throw new Error("No id provided");
      }

      const productId = c.req.param("productId");
      if (!productId) {
        throw new Error("No productId provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error("Invalid JSON in body['data']. Got: " + body["data"]);
      }

      const entity = await this.service.findById({ id });
      if (!entity) {
        throw new Error("No entity found with id:" + id);
      }

      await this.service.deanonymize({ id, email: data.email });

      const order = await ecommerceOrderApi.create({
        data: { comment: data.comment },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      const orderToProduct = await ecommerceOrdersToProductsApi.create({
        data: {
          productId,
          orderId: order.id,
          quantity: data.quantity || 1,
        },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      const result = await this.service.ecommerceOrdersCheckout({
        id,
        orderId: order.id,
        data,
      });

      return c.json({ data: result });
    } catch (error: any) {
      throw new HTTPException(error.status || 500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
