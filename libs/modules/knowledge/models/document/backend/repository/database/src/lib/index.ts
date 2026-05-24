import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./schema";
import { Table } from "./schema";

const metadataSchema = z.record(z.unknown());
const tagsSchema = z.array(z.string());

export const insertSchema = createInsertSchema(Table).extend({
  metadata: metadataSchema.optional(),
  tags: tagsSchema.optional(),
});
export const selectSchema = createSelectSchema(Table).extend({
  metadata: metadataSchema,
  tags: tagsSchema,
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
