import { getHttpErrorType } from "@sps/backend-utils";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { MiddlewareHandler } from "hono";

export interface IMiddlewareGeneric {}

type IService = {
  subjectsToEcommerceModuleOrders: {
    find(props: unknown): Promise<
      Array<{
        id?: string;
        subjectId?: string;
        ecommerceModuleOrderId?: string;
      }>
    >;
  };
};

export class Middleware {
  constructor(private readonly service: IService) {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      try {
        const id = c.req.param("id");

        if (!id) {
          throw new Error("Validation error. No id provided");
        }

        const orderId = c.req.param("orderId");

        if (!orderId) {
          throw new Error("Validation error. No orderId provided");
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
                    method: "eq",
                    value: orderId,
                  },
                ],
              },
              limit: 1,
            },
          });

        if (!subjectsToEcommerceModuleOrders?.length) {
          throw new Error(
            "Authorization error. Requested ecommerce-module order does not belong to subject",
          );
        }

        return next();
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}
