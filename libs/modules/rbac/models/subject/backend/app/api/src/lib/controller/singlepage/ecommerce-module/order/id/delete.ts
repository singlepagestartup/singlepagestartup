import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { authorization, getHttpErrorType, verifyJwt } from "@sps/backend-utils";
import { Service } from "../../../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const orderId = c.req.param("orderId");

      if (!orderId) {
        throw new Error("Validation error. No orderId provided");
      }

      const token = authorization(c);

      if (!token) {
        throw new Error("Authentication error. Token required");
      }

      const decoded = await verifyJwt(token, RBAC_JWT_SECRET, {
        type: "access",
      });

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new Error("Permission error. Only order owner can update order");
      }

      const entity = await this.service.findById({
        id,
      });

      if (!entity) {
        throw new Error("Not Found error. No entity found");
      }

      await this.service.ecommerceModuleOrderMutateCart({
        subjectId: id,
        orderId,
      });

      return c.json({
        data: {
          ...entity,
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
