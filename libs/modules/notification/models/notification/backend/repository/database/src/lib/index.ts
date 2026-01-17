import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";
import { z } from "zod";

export const insertSchema = createInsertSchema(Table).extend({
  data: z.record(z.any()).default({}),
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
  data: z.record(z.any()).default({}),
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
