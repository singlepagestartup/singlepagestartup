import {
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../../service";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const orderId = c.req.param("orderId");

      if (!orderId) {
        throw new Error("Validation error. No orderId provided");
      }

      const token = authorization(c);

      if (!token) {
        throw new Error("Validation error. No token");
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new Error("Validation error. Only order owner can update order");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);

      if (
        !Array.isArray(data.ordersToProducts) ||
        !data.ordersToProducts.length ||
        data.ordersToProducts.some(
          (line: { id?: string; quantity?: number }) =>
            !line ||
            typeof line.id !== "string" ||
            !Number.isSafeInteger(line.quantity) ||
            Number(line.quantity) <= 0,
        )
      ) {
        throw new Error("Validation error. No ordersToProducts provided");
      }

      const entity = await this.service.findById({
        id,
      });

      if (!entity) {
        throw new Error("Not Found error. No entity found");
      }

      await this.service.ecommerceModuleOrderAssertAccess({
        subjectId: id,
        orderId,
        lineIds: data.ordersToProducts.map((line: { id: string }) => line.id),
      });

      const order = await this.service.ecommerceModule.order.findById({
        id: orderId,
      });

      if (!order) {
        throw new Error("Not Found error. No order found");
      }

      if (order.status !== "new") {
        throw new Error("Not Found error. Order is not in 'new' status");
      }

      const lines = await this.service.ecommerceModule.ordersToProducts.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: orderId }],
          },
        },
      });
      for (const line of lines) {
        const product = await this.service.ecommerceModule.product.findById({
          id: line.productId,
        });
        if (product?.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG)
          throw new Error(
            "Permission error. Initial Free cannot be changed through a cart",
          );
      }

      await ecommerceOrderApi.update({
        id: orderId,
        data: {
          ordersToProducts: data.ordersToProducts.map(
            (line: { id: string; quantity: number }) => ({
              id: line.id,
              quantity: line.quantity,
            }),
          ),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: {
          ...entity,
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
