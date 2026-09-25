import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { applyOutputSchema } from "@sps/shared-backend-api";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return next();
      }

      const data = JSON.parse(body["data"]);

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. No uuid provided");
      }

      const entity = await this.service.changePassword({
        id: uuid,
        data,
      });

      /**
       * This handler builds its own response instead of going through the
       * shared REST handlers, so it has to apply the model's output schema
       * itself (issue #270). Without it the identity password hash, salt and
       * reset code are returned to the caller.
       */
      return c.json(
        {
          data: applyOutputSchema({ c, service: this.service, data: entity }),
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
