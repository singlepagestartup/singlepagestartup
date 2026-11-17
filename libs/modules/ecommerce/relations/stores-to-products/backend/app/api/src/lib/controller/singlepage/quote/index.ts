import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { MUTATION_SKIPPED_CONTEXT_KEY } from "@sps/shared-utils";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../service";

const selection = z
  .object({
    quantity: z.number().int().positive().safe(),
    currencyId: z.union([z.string().uuid(), z.literal("")]),
    destination: z
      .object({
        address: z.string().max(500).optional(),
        region: z.string().max(128).optional(),
        pickupPointId: z.string().max(128).optional(),
        coordinates: z
          .object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          })
          .optional(),
      })
      .strict()
      .optional(),
    services: z
      .array(
        z
          .object({
            offerId: z.string().uuid(),
            quantity: z.number().int().positive().safe(),
          })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict();

export class Handler {
  constructor(private readonly service: Service) {}
  async execute(c: Context) {
    c.set(MUTATION_SKIPPED_CONTEXT_KEY, true);
    c.header("Cache-Control", "private, no-store");
    const id = z.string().uuid().safeParse(c.req.param("uuid"));
    const input = selection.safeParse(await c.req.json().catch(() => null));
    if (!id.success || !input.success) {
      throw new HTTPException(400, { message: "Invalid offer quote request" });
    }
    try {
      const data = await this.service.quote({
        ...input.data,
        offerId: id.data,
      });
      return c.json({ data });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
