import { RBAC_SECRET_KEY } from "@sps/shared-utils";
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

      if (!data["provider"]) {
        throw new Error("Validation error. No provider provided");
      }

      if (!data["email"]) {
        throw new Error("Validation error. No email provided");
      }

      if (!data["ecommerceModule"]) {
        throw new Error("Validation error. No ecommerceModule provided");
      }

      if (!data["ecommerceModule"]["orders"]?.length) {
        throw new Error("Validation error. No ecommerceModule.orders provided");
      }

      if (
        !data["ecommerceModule"]["orders"].every((order: { id: string }) => {
          return order.id;
        })
      ) {
        throw new Error(
          "Validation error. No ecommerceModule.orders[number].id provided",
        );
      }

      const entity = await this.service.findById({ id });

      if (!entity) {
        throw new Error("Not Found error. No entity found with id:" + id);
      }

      await this.service.deanonymize({ id, email: data.email });

      for (const dataEcommerceModuleOrder of data.ecommerceModule.orders) {
        await ecommerceModuleOrderApi
          .findById({
            id: dataEcommerceModuleOrder.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          })
          .then(async (ecommerceModuleOrder) => {
            if (!RBAC_SECRET_KEY) {
              throw new Error("Configuration error. RBAC_SECRET_KEY not set");
            }

            if (!ecommerceModuleOrder) {
              return;
            }

            await ecommerceModuleOrderApi.update({
              id: ecommerceModuleOrder.id,
              data: {
                ...ecommerceModuleOrder,
                comment: data.comment,
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  "Cache-Control": "no-store",
                },
              },
            });
          });
      }

      const result = await this.service.ecommerceOrderCheckout({
        id,
        email: data.email,
        provider: data.provider,
        ecommerceModule: data.ecommerceModule,
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
