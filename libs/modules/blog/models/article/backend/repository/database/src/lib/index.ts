import { entityMetadataSchema } from "@sps/shared-utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";
import { z } from "zod";

export const insertSchema = createInsertSchema(Table, {
  metadata: entityMetadataSchema.optional(),
}).extend({
  title: z.record(z.any()).default({}),
  subtitle: z.record(z.any()).default({}),
  description: z.record(z.any()).default({}),
});
export const selectSchema = createSelectSchema(Table, {
  metadata: entityMetadataSchema,
}).extend({
  title: z.record(z.any()).default({}),
  subtitle: z.record(z.any()).default({}),
  description: z.record(z.any()).default({}),
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
