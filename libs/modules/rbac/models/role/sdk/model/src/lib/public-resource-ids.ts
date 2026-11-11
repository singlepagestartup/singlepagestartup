import { z } from "zod";

export const publicResourceIdsSchema = z
  .object({
    resource: z.string().regex(/^\/api(?:\/[a-z0-9-]+){2,}$/),
  })
  .strict();

export interface IPublicResourceIdsParams
  extends z.infer<typeof publicResourceIdsSchema> {}
