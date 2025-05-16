import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceStoresToOrdersToApi } from "@sps/ecommerce/relations/stores-to-orders/sdk/server";
import { api as ecommerceModuleStoreApi } from "@sps/ecommerce/models/store/sdk/server";

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

      let storeId = data.storeId;

      if (!storeId) {
        const stores = await ecommerceModuleStoreApi.find({
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (stores?.length === 0) {
          throw new Error("No stores found");
        }

        if (stores?.length && stores.length > 1) {
          throw new Error("Multiple stores found. Pass 'data.storeId'");
        }

        storeId = stores?.[0]?.id;
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

      await ecommerceOrdersToProductsApi.create({
        data: {
          productId,
          orderId: order.id,
          quantity: data.quantity || 1,
        },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      await ecommerceStoresToOrdersToApi.create({
        data: {
          storeId,
          orderId: order.id,
        },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      const result = await this.service.ecommerceOrderCheckout({
        id,
        email: data.email,
        provider: data.provider,
        ecommerceModule: {
          orders: [{ id: order.id }],
        },
        comment: data.comment,
        billingModule: {
          currency: {
            id: data.billingModule?.currency?.id,
          },
        },
      });

      return c.json({ data: result });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
