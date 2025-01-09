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
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const id = c.req.param("id");

    if (!id) {
      throw new HTTPException(400, {
        message: "No id provided",
      });
    }

    const productId = c.req.param("productId");

    if (!productId) {
      throw new HTTPException(400, {
        message: "No productId provided",
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

    const entity = await this.service.findById({
      id,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    await this.service.deanonymize({
      id,
      email: data.email,
    });

    const order = await ecommerceOrderApi.create({
      data: {
        comment: data.comment,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    const orderToProduct = await ecommerceOrdersToProductsApi.create({
      data: {
        productId,
        orderId: order.id,
        quantity: data.quantity || 1,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    const result = await this.service.ecommerceOrdersCheckout({
      id,
      orderId: order.id,
      data,
    });

    return c.json({
      data: result,
    });
  }
}
