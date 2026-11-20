import { getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { Service as SubjectService } from "../../../../../../service";
import { Service as ChatActivity } from "../../../../../../service/singlepage/social-module/chat/activity";

const payload = z.object({ messageId: z.string().uuid() }).strict();

export class Handler {
  constructor(readonly service: SubjectService) {}

  async execute(c: Context): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      const chatId = c.req.param("socialModuleChatId");
      const threadId = c.req.param("socialModuleThreadId");
      if (!subjectId || !chatId || !threadId) {
        throw new Error(
          "Validation error. Subject, chat and thread IDs are required",
        );
      }
      const body = await c.req.parseBody();
      let raw: unknown;
      try {
        raw = typeof body.data === "string" ? JSON.parse(body.data) : undefined;
      } catch {
        throw new Error("Validation error. Invalid read marker");
      }
      const marker = payload.safeParse(raw);
      if (!marker.success) {
        throw new Error("Validation error. A valid message ID is required");
      }

      const result = await new ChatActivity(this.service).markRead({
        subjectId,
        chatId,
        threadId,
        messageId: marker.data.messageId,
      });
      c.header("X-SPS-SKIP-ACTION-LOGGER", "1");
      return c.json({ data: result });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
