import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { READ_ONLY_OPERATION_CONTEXT_KEY } from "@sps/shared-utils";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../service";

const inputSchema = z
  .object({
    query: z.string().trim().min(3).max(500),
    language: z.string().regex(/^[a-z]{2}$/i),
  })
  .strict();

export class Handler {
  constructor(private readonly service: Service) {}
  async execute(c: Context) {
    c.set(READ_ONLY_OPERATION_CONTEXT_KEY, true);
    c.header("Cache-Control", "private, no-store");
    const id = z.string().uuid().safeParse(c.req.param("uuid"));
    const input = inputSchema.safeParse(await c.req.json().catch(() => null));
    if (!id.success || !input.success) {
      throw new HTTPException(400, {
        message: "Invalid address suggestions request",
      });
    }
    try {
      const data = await this.service.addressSuggestions(
        { ...input.data, offerId: id.data },
        c.req.raw.signal,
      );
      return c.json({ data });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
