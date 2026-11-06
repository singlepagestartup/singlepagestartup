import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";

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

      /**
       * `RequestSubjectIdOwner` has matched the caller to `:id`. The service
       * keeps the lines to the orders linked to that subject, so the caller's
       * filters only narrow them (issue #349).
       */
      const ecommerceModuleOrdersToProducts =
        await this.service.ecommerceOrderOrdersToProducts({
          id,
          filters: c.get("parsedQuery")?.filters?.["and"],
        });

      return c.json({
        data: ecommerceModuleOrdersToProducts,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
