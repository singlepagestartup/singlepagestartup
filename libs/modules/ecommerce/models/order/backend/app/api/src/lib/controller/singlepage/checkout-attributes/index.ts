import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC secret key not found");
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        return c.json(
          {
            message: "Invalid id",
          },
          {
            status: 400,
          },
        );
      }

      const billingModuleCurrencyId = c.req.param("billingModuleCurrencyId");

      if (!billingModuleCurrencyId) {
        return c.json(
          {
            message: "Invalid billing module currency id",
          },
          {
            status: 400,
          },
        );
      }

      const attributes = await this.service.getCheckoutAttributes({
        id: uuid,
        billingModuleCurrencyId,
      });

      return c.json({
        data: attributes,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
