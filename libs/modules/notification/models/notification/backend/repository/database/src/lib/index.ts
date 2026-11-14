import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";
import { z } from "zod";

// Delivery IDs use the UUID storage format and retain the bits of the original digest.
export const notificationIdSchema = z.guid();

export const insertSchema = createInsertSchema(Table).extend({
  id: notificationIdSchema.optional(),
  data: z.record(z.string(), z.any()).default({}),
  attachments: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
      }),
    )
    .default([]),
});
export const selectSchema = createSelectSchema(Table).extend({
  id: notificationIdSchema,
  data: z.record(z.string(), z.any()).default({}),
  attachments: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
      }),
    )
    .default([]),
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
