import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC secret key not found",
        });
      }

      const id = c.req.param("id");

      if (!id) {
        throw new HTTPException(400, {
          message: "Invalid id. Got: " + id,
        });
      }

      let entity = await this.service.findById({ id });

      if (!entity) {
        throw new HTTPException(404, {
          message: "Order not found",
        });
      }

      const total = await this.service.getTotal({ id });

      return c.json({
        data: total,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal server error",
        cause: error,
      });
    }
  }
}
