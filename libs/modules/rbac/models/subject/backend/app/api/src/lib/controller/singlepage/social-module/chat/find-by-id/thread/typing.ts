import { getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { Service as SubjectService } from "../../../../../../service";
import { Service as ChatActions } from "../../../../../../service/singlepage/social-module/chat/actions";

const payload = z.object({ sessionId: z.uuid(), active: z.boolean() }).strict();

export class Handler {
  constructor(readonly service: SubjectService) {}

  async execute(c: Context): Promise<Response> {
    try {
      const chatId = c.req.param("socialModuleChatId");
      const threadId = c.req.param("socialModuleThreadId");
      if (!chatId || !threadId) {
        throw new Error("Validation error. Chat and thread IDs are required");
      }
      const profileId = c.req.param("socialModuleProfileId");
      if (!profileId) {
        throw new Error("Validation error. A profile ID is required");
      }
      const body = await c.req.parseBody();
      let raw: unknown;
      try {
        raw = typeof body.data === "string" ? JSON.parse(body.data) : undefined;
      } catch {
        throw new Error("Validation error. Invalid typing state");
      }
      const marker = payload.safeParse(raw);
      if (!marker.success) {
        throw new Error("Validation error. A valid typing state is required");
      }
      if (c.get("isOrderSupport")) {
        return c.json({ data: { active: false } });
      }

      await new ChatActions(this.service).setTyping({
        chatId,
        threadId,
        profileId,
        ...marker.data,
      });
      return c.json({ data: { active: marker.data.active } });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
