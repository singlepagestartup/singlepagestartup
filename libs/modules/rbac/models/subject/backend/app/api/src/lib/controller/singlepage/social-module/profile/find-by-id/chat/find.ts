import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../../../../service";
import { Service as Chats } from "../../../../../../service/singlepage/social-module/chat/collection";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context, _next?: unknown): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      const socialModuleProfileId = c.req.param("socialModuleProfileId");
      if (!subjectId || !socialModuleProfileId)
        throw new Error(
          "Validation error. Subject and Profile IDs are required",
        );
      const parsed = c.get("parsedQuery");
      const data = await withConsistencySnapshot(() =>
        new Chats(this.service).find({
          subjectId,
          socialModuleProfileId,
          includeSubjectProfiles:
            c.req.query("includeSubjectProfiles") === "true",
          includeParticipants: c.req.query("includeParticipants") === "true",
          params: {
            limit: parsed?.limit || 100,
            offset: parsed?.offset || 0,
            orderBy: parsed?.orderBy,
          },
        }),
      );
      return c.json({ data });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
