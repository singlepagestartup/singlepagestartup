import { RBAC_SECRET_KEY, UUID_VALUE_REGEX } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";

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

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      if (!data?.provider) {
        throw new Error("Validation error. No provider provided");
      }

      if (!data["email"]) {
        throw new Error("Validation error. No email provided");
      }

      if (!data["ecommerceModule"]) {
        throw new Error("Validation error. No ecommerceModule provided");
      }

      const requestedOrders = data.ecommerceModule.orders;
      if (!Array.isArray(requestedOrders) || !requestedOrders.length) {
        throw new Error("Validation error. No ecommerceModule.orders provided");
      }

      const requestedOrderIds: string[] = [];
      for (const order of requestedOrders) {
        if (typeof order?.id !== "string" || !UUID_VALUE_REGEX.test(order.id)) {
          throw new Error(
            "Validation error. Expected a UUID for each ecommerceModule.orders entry",
          );
        }
        requestedOrderIds.push(order.id);
      }

      const entity = await this.service.findById({ id });

      if (!entity) {
        throw new Error("Not Found error. No entity found with id:" + id);
      }

      const subjectsToEcommerceModuleOrders =
        await this.service.subjectsToEcommerceModuleOrders.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: id,
                },
                {
                  column: "ecommerceModuleOrderId",
                  method: "inArray",
                  value: requestedOrderIds,
                },
              ],
            },
          },
        });

      if (!subjectsToEcommerceModuleOrders?.length) {
        throw new Error("Not Found error. No ecommerce module orders found");
      }

      const ecommerceModuleOrderIds = subjectsToEcommerceModuleOrders.map(
        (link) => link.ecommerceModuleOrderId,
      );
      const ecommerceModuleOrders = await ecommerceModuleOrderApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ecommerceModuleOrderIds,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!ecommerceModuleOrders?.length) {
        throw new Error("Not Found error. No ecommerce module orders found");
      }

      await this.service.deanonymize({ id, email: data.email });

      if (data.comment !== undefined) {
        for (const order of ecommerceModuleOrders) {
          await ecommerceModuleOrderApi.update({
            id: order.id,
            data: { comment: data.comment },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });
        }
      }

      const result = await this.service.ecommerceOrderCheckout({
        id,
        email: data.email,
        provider: data.provider,
        ecommerceModule: {
          ...data.ecommerceModule,
          orders: ecommerceModuleOrders.map((order) => ({ id: order.id })),
        },
        comment: data.comment,
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
