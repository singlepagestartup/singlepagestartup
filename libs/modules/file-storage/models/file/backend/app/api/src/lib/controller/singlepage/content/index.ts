import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../service";
export class Handler {
  constructor(readonly service: Service) {}
  async execute(c: Context): Promise<Response> {
    try {
      const id = c.req.param("uuid");
      if (!id) throw new Error("Validation error. File id required");
      const file = await this.service.findById({ id });
      if (!file) throw new Error("Not Found error. File not found");
      const bytes = await this.service.readBytes(file);
      c.header("Cache-Control", "private, no-store");
      c.header("Vary", "Authorization, Cookie");
      c.header("Content-Type", file.mimeType || "application/octet-stream");
      c.header("Content-Length", String(bytes.byteLength));
      c.header("X-Content-Type-Options", "nosniff");
      return new Response(
        c.req.method === "HEAD" ? null : new Uint8Array(bytes),
        { status: 200, headers: Object.fromEntries(c.res.headers) },
      );
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
