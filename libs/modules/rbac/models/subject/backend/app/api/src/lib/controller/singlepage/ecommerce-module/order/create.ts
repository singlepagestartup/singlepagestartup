import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ecommerceStoresToOrdersApi } from "@sps/ecommerce/relations/stores-to-orders/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";

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

      const token = authorization(c);

      if (!token) {
        throw new Error("Validation error. No token");
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new Error("Validation error. Only order owner can update order");
      }

      if (!data["productId"]) {
        throw new Error("Validation error. No data.productId provided");
      }

      const productId = data["productId"];

      let storeId = data.storeId;

      if (!storeId) {
        const stores = await this.service.ecommerceModule.store.find();

        if (stores?.length === 0) {
          throw new Error("Not Found error. No stores found");
        }

        if (stores?.length && stores.length > 1) {
          throw new Error(
            "Internal error. Multiple stores found. Pass 'data.storeId'",
          );
        }

        storeId = stores?.[0]?.id;
      }

      const entity = await this.service.findById({
        id,
      });

      if (!entity) {
        throw new Error("Not Found error. No entity found");
      }

      // Asked before the currency: a product the subject already holds does not
      // need a price, and a second cart order for it would be counted twice by
      // the badge, the total and the order list, which all read every open cart
      // of the subject.
      const openCartOrderWithProductId =
        await this.service.ecommerceModuleFindOpenCartOrderWithProduct({
          subjectId: id,
          productId,
        });

      if (openCartOrderWithProductId) {
        throw new Error("Validation error. Product is already in the cart");
      }

      // Resolved before the first write: the order, its subject link, its
      // product line and its store link would otherwise be committed only for
      // the currency link to fail, leaving a cart order no total can be
      // computed for.
      const billingModuleCurrencyId =
        await this.service.ecommerceModuleResolveOrderCurrency({
          productId,
          billingModuleCurrencyId: data["billingModule"]?.currency?.id,
        });

      const order = await ecommerceOrderApi.create({
        data: {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!order) {
        throw new Error("Not Found error. No order found");
      }

      await subjectsToEcommerceModuleOrdersApi.create({
        data: {
          subjectId: id,
          ecommerceModuleOrderId: order.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const ordersToProducts = await ecommerceOrdersToProductsApi.create({
        data: {
          orderId: order.id,
          productId: productId,
          quantity: data.quantity || 1,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!ordersToProducts) {
        throw new Error("Not Found error. No orders to products found");
      }

      const storesToOrders = await ecommerceStoresToOrdersApi.create({
        data: {
          storeId: storeId,
          orderId: order.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!storesToOrders) {
        throw new Error("Not Found error. No stores to orders found");
      }

      const ordersToBillingModuleCurrencies =
        await ecommerceOrdersToBillingModuleCurrenciesApi.create({
          data: {
            orderId: order.id,
            billingModuleCurrencyId: billingModuleCurrencyId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      if (!ordersToBillingModuleCurrencies) {
        throw new Error(
          "Not Found error. No orders to billing module currencies found",
        );
      }

      return c.json({
        data: {
          ...entity,
          data,
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
