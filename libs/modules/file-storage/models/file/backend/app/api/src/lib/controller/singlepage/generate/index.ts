import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api } from "@sps/file-storage/models/file/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
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

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid data");
      }

      const data = JSON.parse(body["data"]);

      if (!data.generateData) {
        throw new Error("Validation error. 'data.generateData' is required");
      }
      if (
        data.generateData.variant?.startsWith(
          "generate-template-ecommerce-order-receipt-",
        )
      ) {
        throw new Error(
          "Forbidden error. Receipts use protected order storage",
        );
      }
      const url = this.service.imageGeneratorUrl(data.generateData);

      const entity = await api.createFromUrl({
        data: {
          ...data,
          url,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
