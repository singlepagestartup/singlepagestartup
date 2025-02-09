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
      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      if (!uuid) {
        throw new HTTPException(400, {
          message: "Invalid id. Got: " + uuid,
        });
      }

      if (body["data"] && typeof body["data"] !== "string") {
        throw new HTTPException(422, {
          message:
            "Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        });
      }

      const payloadData = JSON.parse(body["data"]);

      const data = await this.service.render({
        id: uuid,
        type: "email",
        payload: payloadData,
      });

      if (!data) {
        throw new HTTPException(404, {
          message: "Not Found",
        });
      }

      if (!Object.keys(data).length) {
        throw new HTTPException(422, {
          message: "Unprocessable Entity",
        });
      }

      return c.json({
        data,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
