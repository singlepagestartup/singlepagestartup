import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service as SubjectService } from "../../../service";
import { Service as Balance } from "../../../service/singlepage/billing/balance";

export class Handler {
  constructor(readonly service: SubjectService) {}

  async execute(c: Context): Promise<Response> {
    try {
      const id = c.req.param("id");
      if (!id) throw new Error("Validation error. Subject id is required");
      return c.json({ data: await new Balance(this.service).execute(id) });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
