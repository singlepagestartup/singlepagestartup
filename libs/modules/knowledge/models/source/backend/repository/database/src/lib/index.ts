import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./schema";
import { Table } from "./schema";

const metadataSchema = z.record(z.unknown());

export const insertSchema = createInsertSchema(Table).extend({
  metadata: metadataSchema.optional(),
});
export const selectSchema = createSelectSchema(Table).extend({
  metadata: metadataSchema,
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
