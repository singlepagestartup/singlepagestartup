import { getFileContentHeaders, getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { ProtectedFile } from "../../service/singlepage/protected-file";

export class Handler {
  constructor(private readonly files: ProtectedFile) {}

  async execute(c: Context) {
    try {
      const id = z.uuid().parse(c.req.param("fileId"));
      const subjectId = z.uuid().parse(c.get("signedInSubjectId"));
      const file = await this.files.content(subjectId, id, c.req.method);
      const headers = getFileContentHeaders(file.name, file.mimeType);
      headers.set("Content-Type", file.mimeType);
      headers.set("Content-Length", String(file.size));
      headers.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      );
      headers.set("Cache-Control", "private, no-store");
      headers.set("Vary", "Authorization, Cookie");
      const body = c.req.method === "HEAD" ? null : new Uint8Array(file.bytes);
      return new Response(body, { headers });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(422, {
          message: "Validation error. Invalid file id",
        });
      }
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
