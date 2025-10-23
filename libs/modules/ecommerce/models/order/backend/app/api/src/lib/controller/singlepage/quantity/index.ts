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
        throw new Error("Configuration error. RBAC secret key not found");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. Invalid id. Got: " + id);
      }

      let entity = await this.service.findById({ id });

      if (!entity) {
        throw new Error("Not Found error. Order not found");
      }

      const quantity = await this.service.getQuantity({ id });

      return c.json({
        data: quantity,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
