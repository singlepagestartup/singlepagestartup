import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../../../../../../service";

export class Handler {
  constructor(private readonly service: Service) {}
  async execute(c: Context, _next?: unknown): Promise<Response> {
    try {
      c.header("Cache-Control", "private, no-store");
      const id = c.req.param("id"),
        profileId = c.req.param("socialModuleProfileId"),
        chatId = c.req.param("socialModuleChatId");
      if (!id || !profileId || !chatId)
        throw new Error("Validation error. Chat scope required");
      return c.json({
        data: await this.service.providerConnections.chatModels(
          id,
          profileId,
          chatId,
        ),
      });
    } catch (error) {
      const { status, message } = getHttpErrorType(error);
      throw new HTTPException(status, { message });
    }
  }
}
