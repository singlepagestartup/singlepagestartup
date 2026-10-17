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
      await this.service.socialModuleProfileOwnershipEnsure({ subjectId });
      const data = await new Profiles(this.service).find({
        subjectId,
        params: c.get("parsedQuery"),
      });
      return c.json({ data });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
