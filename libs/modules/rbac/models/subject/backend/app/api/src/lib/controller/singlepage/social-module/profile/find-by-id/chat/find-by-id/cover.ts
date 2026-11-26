import type { Context } from "hono";
import type { IModel as Chat } from "@sps/social/models/chat/sdk/model";
import { Handler as ChatDetail } from "./index";

export class Handler extends ChatDetail {
  protected override async response(c: Context, chat: Chat): Promise<Response> {
    if (c.get("sharedTaskThread")) {
      throw new Error("Not found error. The task discussion has no cover");
    }
    const file = await this.service.socialChatSettings.coverContent(chat.id);
    return new Response(Uint8Array.from(file.bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Cache-Control": "private, no-store",
        Vary: "Authorization, Cookie",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
