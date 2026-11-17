import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { ecommerceCartSelectionSchema } from "@sps/rbac/models/subject/sdk/model";
import { MUTATION_SKIPPED_CONTEXT_KEY } from "@sps/shared-utils";
import type { Service } from "../../../../../service";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context, next: unknown): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      const orderId = c.req.param("orderId");
      if (!subjectId || !orderId) {
        throw new Error("Validation error. Subject and order IDs are required");
      }
      const body = await c.req.parseBody();
      if (typeof body.data !== "string") {
        throw new Error("Validation error. Selection data is required");
      }
      const parsed = ecommerceCartSelectionSchema.safeParse(
        JSON.parse(body.data),
      );
      if (!parsed.success) {
        throw new Error("Validation error. Invalid cart selection");
      }
      const result = await this.service.ecommerceModuleOrderSelection({
        subjectId,
        orderId,
        data: parsed.data,
      });
      if (!result.applied) {
        c.set(MUTATION_SKIPPED_CONTEXT_KEY, true);
      }
      return c.json({ data: result });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
