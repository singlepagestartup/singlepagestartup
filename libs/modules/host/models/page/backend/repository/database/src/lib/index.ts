import { entityMetadataSchema } from "@sps/shared-utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

export const insertSchema = createInsertSchema(Table, {
  metadata: entityMetadataSchema.optional(),
  slug: (schema) => schema.trim().min(1),
});
export const selectSchema = createSelectSchema(Table, {
  metadata: entityMetadataSchema,
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
