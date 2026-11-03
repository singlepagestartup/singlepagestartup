import { getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../service";
import { articleCreateSchema } from "@sps/rbac/models/subject/sdk/model/src/lib/blog-article-create";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      if (!subjectId)
        throw new Error("Validation error. Subject ID is required");
      if (!c.req.header("content-type")?.includes("application/json"))
        throw new Error("Validation error. Article data must be JSON");
      const raw = await c.req.text();
      if (new TextEncoder().encode(raw).byteLength > 256 * 1024 + 64)
        throw new Error("Validation error. Article payload is too large");
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new Error("Validation error. Invalid Article JSON");
      }
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length !== 1 ||
        !("data" in body)
      )
        throw new Error("Validation error. Invalid Article request envelope");
      const parsed = articleCreateSchema.safeParse(body.data);
      if (!parsed.success)
        throw new Error("Validation error. Invalid Article creation values");
      const data = await this.service.blogModuleArticleCreate({
        subjectId,
        data: parsed.data,
      });
      return c.json({ data }, 201);
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
