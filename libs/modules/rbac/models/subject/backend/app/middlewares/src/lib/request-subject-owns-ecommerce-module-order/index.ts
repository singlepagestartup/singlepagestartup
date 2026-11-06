import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
export interface IMiddlewareGeneric {}
export interface IService {
  ecommerceModuleOrderAssertAccess(props: {
    subjectId: string;
    orderId: string;
  }): Promise<void>;
}
export class Middleware {
  constructor(private readonly service: IService) {}
  init() {
    return createMiddleware(async (c, next) => {
      try {
        const subjectId = c.req.param("id");
        const orderId = c.req.param("orderId");
        if (!subjectId || !orderId)
          throw new Error(
            "Validation error. Subject and order IDs are required",
          );
        await this.service.ecommerceModuleOrderAssertAccess({
          subjectId,
          orderId,
        });
        await next();
      } catch (error) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}
