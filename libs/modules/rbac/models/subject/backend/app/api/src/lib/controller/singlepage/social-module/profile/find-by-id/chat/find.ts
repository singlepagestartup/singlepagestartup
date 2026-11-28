import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../../../../service";
import { Service as Chats } from "../../../../../../service/startup/social-module/chat/collection";

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
      const limit = Number(parsed?.limit ?? 100);
      const offset = Number(parsed?.offset ?? 0);
      if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        !Number.isSafeInteger(offset) ||
        offset < 0
      ) {
        throw new Error("Validation error. Invalid chat page");
      }
      const data = await withConsistencySnapshot(() =>
        new Chats(this.service).find({
          subjectId,
          socialModuleProfileId,
          search: c.req.query("search"),
          language: c.req.query("language"),
          membershipsOnly: c.req.query("membershipsOnly") === "true",
          includeSubjectProfiles:
            c.req.query("includeSubjectProfiles") === "true",
          includeParticipants: c.req.query("includeParticipants") === "true",
          params: {
            limit,
            offset,
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
