import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";
import { Service as ProfileOwnership } from "../../../../service/startup/social-module/profile/ownership";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      if (!subjectId) {
        throw new Error("Validation error. Subject id is required");
      }
      const ownership = await new ProfileOwnership(this.service).ensure({
        subjectId,
        allowGuest: true,
      });
      return c.json({ data: ownership.profile });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
