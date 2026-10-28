import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service as Content } from "../../../../../service/singlepage/blog/article/content";
export class Handler {
  async execute(c: Context): Promise<Response> {
    try {
      const id = c.req.param("id"),
        blogModuleArticleId = c.req.param("blogModuleArticleId");
      if (!id || !blogModuleArticleId)
        throw new Error("Validation error. Subject and article IDs required");
      c.header("Cache-Control", "private, no-store");
      c.header("Vary", "Authorization, Cookie");
      const result = await new Content(
        c.get("protectedBlogGraphService"),
      ).execute({
        id,
        blogModuleArticleId,
        graph: c.get("protectedBlogGraph"),
      });
      return c.json({ data: result });
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
