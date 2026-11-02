import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. Invalid id. Got: " + uuid);
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        );
      }

      const parsed = JSON.parse(body["data"]);

      if (!parsed?.data || typeof parsed.data !== "object") {
        throw new Error("Validation error. Consume data is required");
      }

      const entity = await this.service.consume({
        id: uuid,
        data: parsed.data,
        filters: parsed.filters,
      });

      // An unmatched predicate is not an error: the caller asked whether it
      // could claim the row and the answer is no.
      return c.json({
        data: entity ?? null,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
