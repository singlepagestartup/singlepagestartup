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

      if (!uuid) {
        throw new Error("Validation error. Invalid id. Got: " + uuid);
      }

      const entity = await this.service.findById({ id: uuid });

      if (!entity) {
        throw new Error("Not Found error. Notification not found");
      }

      const deleted = await this.service.delete({ id: uuid });

      if (entity.reciever && entity.sourceSystemId) {
        try {
          await this.service.deleteBySourceSystem({
            reciever: entity.reciever,
            sourceSystemId: entity.sourceSystemId,
            entity,
          });
        } catch (error) {
          console.log(
            "🚀 ~ delete notification deleteBySourceSystem error:",
            error,
          );
        }
      }

      return c.json({
        data: deleted,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
