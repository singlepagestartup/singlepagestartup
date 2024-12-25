import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC secret key not found",
      });
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
  }
}
