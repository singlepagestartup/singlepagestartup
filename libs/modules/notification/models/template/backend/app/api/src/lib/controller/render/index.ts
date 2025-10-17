import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      const entity = await this.service.findById({
        id: uuid,
      });

      if (!entity) {
        throw new Error("Not found");
      }

      if (!uuid) {
        throw new Error("Invalid id. Got: " + uuid);
      }

      if (body["data"] && typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        );
      }

      const payloadData = JSON.parse(body["data"]);

      const type = entity.variant.includes("email")
        ? "email"
        : entity.variant.includes("telegram")
          ? "telegram"
          : null;

      if (!type) {
        throw new Error("Invalid type. Expected email, got: " + type);
      }

      const data = await this.service.render({
        id: uuid,
        type,
        payload: payloadData,
      });

      if (!data) {
        throw new Error("Not Found");
      }

      if (!Object.keys(data).length) {
        throw new Error("Unprocessable Entity");
      }

      return c.json({
        data,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
