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
      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. Invalid id");
      }

      const data = await this.service.send({ id: uuid });

      if (!data || !Object.keys(data).length) {
        throw new Error("Not Found error. Not found");
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
