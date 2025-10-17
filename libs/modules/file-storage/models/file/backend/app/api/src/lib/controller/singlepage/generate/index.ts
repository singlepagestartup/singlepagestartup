import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import pako from "pako";
import { api } from "@sps/file-storage/models/file/sdk/server";
import { HOST_SERVICE_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import QueryString from "qs";
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

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Invalid data");
      }

      const data = JSON.parse(body["data"]);

      const deflatedData = pako.deflate(JSON.stringify(data));

      const queryData = Buffer.from(deflatedData).toString("base64");

      const query = QueryString.stringify({
        variant: data.variant,
        width: data.width ?? 500,
        height: data.height ?? 500,
        data: queryData,
      });

      const entity = await api.createFromUrl({
        data: {
          url: `${HOST_SERVICE_URL}/api/image-generator/image.png?${query}`,
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
