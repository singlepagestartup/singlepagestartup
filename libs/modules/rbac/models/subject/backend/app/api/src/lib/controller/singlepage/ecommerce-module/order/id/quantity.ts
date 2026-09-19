import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const orderId = c.req.param("orderId");

      if (!orderId) {
        throw new Error("Validation error. No orderId provided");
      }

      const ecommerceModuleOrder =
        await this.service.ecommerceModule.order.findById({
          id: orderId,
        });

      if (!ecommerceModuleOrder) {
        throw new Error("Not Found error. No order found");
      }

      await this.service.ecommerceModuleAssertSubjectOwnsOrder({
        subjectId: id,
        ecommerceModuleOrderId: orderId,
      });

      const ecommerceModuleOrderQuantity =
        await this.service.ecommerceModule.order.findByIdQuantity({
          id: orderId,
        });

      return c.json({
        data: ecommerceModuleOrderQuantity,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
