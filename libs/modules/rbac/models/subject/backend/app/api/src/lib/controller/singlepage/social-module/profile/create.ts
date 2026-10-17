import { getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../service";
import { Service as Profiles } from "../../../../service/singlepage/social-module/profile/collection";

export class Handler {
  constructor(readonly service: Service) {}
  async execute(c: Context): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      if (!subjectId)
        throw new Error("Validation error. Subject id is required");
      const body = await c.req.parseBody();
      if (typeof body.data !== "string")
        throw new Error("Validation error. Profile data must be JSON");
      let data;
      try {
        data = JSON.parse(body.data);
      } catch {
        throw new Error("Validation error. Invalid profile JSON");
      }
      return c.json(
        { data: await new Profiles(this.service).create({ subjectId, data }) },
        201,
      );
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
