import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./schema";
import { Table } from "./schema";

const metadataSchema = z.record(z.unknown());
const embeddingSchema = z.array(z.number()).length(768);

export const insertSchema = createInsertSchema(Table).extend({
  embedding: embeddingSchema,
  metadata: metadataSchema.optional(),
});
export const selectSchema = createSelectSchema(Table).extend({
  embedding: embeddingSchema,
  metadata: metadataSchema,
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
