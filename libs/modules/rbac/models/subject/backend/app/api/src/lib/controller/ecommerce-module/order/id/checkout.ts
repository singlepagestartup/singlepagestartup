import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/backend-utils";
import { Service } from "../../../../service";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new HTTPException(400, {
          message: "RBAC_JWT_SECRET not set",
        });
      }

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

      const orderId = c.req.param("orderId");

      if (!orderId) {
        throw new HTTPException(400, {
          message: "No orderId provided",
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

      const token = authorization(c);

      if (!token) {
        return c.json(
          {
            data: null,
          },
          {
            status: 401,
          },
        );
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new HTTPException(403, {
          message: "Only order owner can update order",
        });
      }

      const order = await ecommerceOrderApi.findById({
        id: orderId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!order) {
        throw new HTTPException(404, {
          message: "No order found",
        });
      }

      if (order.status !== "new") {
        throw new HTTPException(400, {
          message: "Order is not in 'new' status",
        });
      }

      await this.service.deanonymize({
        id,
        email: data["email"],
      });

      const result = await this.service.ecommerceOrdersCheckout({
        id: id,
        orderId: orderId,
        data,
      });

      return c.json({
        data: result,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
