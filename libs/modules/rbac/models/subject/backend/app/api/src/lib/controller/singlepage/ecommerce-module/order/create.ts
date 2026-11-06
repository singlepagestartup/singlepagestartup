import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import {
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";

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

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET, "HS256");

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
      const product = await this.service.ecommerceModule.product.findById({
        id: productId,
      });
      if (!product) throw new Error("Not Found error. Product not found");
      if (product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG)
        throw new Error(
          "Permission error. Initial Free is available only through authentication bootstrap",
        );
      const quantity = data.quantity ?? 1;
      if (!Number.isInteger(quantity) || quantity < quantityBounds.min || quantity > quantityBounds.max) {
        throw new Error(`Validation error. Quantity must be an integer between ${quantityBounds.min} and ${quantityBounds.max}`);
      }

      const requestedCurrencyId = data["billingModule"]?.currency?.id;

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

      await this.service.ecommerceModuleOrderCreate({
        subjectId: id,
        productId,
        storeId,
        quantity,
        billingModuleCurrencyId: requestedCurrencyId,
      });

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
