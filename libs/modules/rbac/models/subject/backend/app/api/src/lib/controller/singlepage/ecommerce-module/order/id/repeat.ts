import { getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { Service } from "../../../../../service";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const params = z
        .object({
          subjectId: z.string().uuid(),
          socialModuleProfileId: z.string().uuid(),
          orderId: z.string().uuid(),
        })
        .safeParse({
          subjectId: c.req.param("id"),
          socialModuleProfileId: c.req.param("socialModuleProfileId"),
          orderId: c.req.param("orderId"),
        });
      if (!params.success) {
        throw new Error(
          "Validation error. Subject, profile and order IDs are required",
        );
      }

      const result = await this.service.ecommerceModuleOrderRepeat(params.data);
      return c.json({ data: result });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
