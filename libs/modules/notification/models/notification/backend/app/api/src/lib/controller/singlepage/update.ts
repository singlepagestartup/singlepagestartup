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

      if (!uuid) {
        throw new Error("Validation error. Invalid id. Got: " + uuid);
      }

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        );
      }

      const data = JSON.parse(body["data"]);

      const entity = await this.service.update({ id: uuid, data });

      if (!entity) {
        throw new Error("Not found error. Entity not found with id: " + uuid);
      }

      if (entity.reciever && entity.sourceSystemId) {
        try {
          await this.service.editBySourceSystem({
            reciever: entity.reciever,
            sourceSystemId: entity.sourceSystemId,
          });
        } catch (error) {
          // keep update response even if external update fails
          console.log(
            "🚀 ~ update notification editBySourceSystem error:",
            error,
          );
        }
      }

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
