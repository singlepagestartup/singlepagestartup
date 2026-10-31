import { entityMetadataSchema } from "@sps/shared-utils";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { supportedMcpServerIdentifiers, Table } from "./schema";
import { z } from "zod";

const allowedMcpServerIdsSchema = z
  .array(z.enum(supportedMcpServerIdentifiers))
  .default([]);

export const insertSchema = createInsertSchema(Table, {
  metadata: entityMetadataSchema.optional(),
}).extend({
  title: z.record(z.any()).default({}),
  subtitle: z.record(z.any()).default({}),
  description: z.record(z.any()).default({}),
  allowedMcpServerIds: allowedMcpServerIdsSchema,
});
export const selectSchema = createSelectSchema(Table, {
  metadata: entityMetadataSchema,
}).extend({
  title: z.record(z.any()).default({}),
  subtitle: z.record(z.any()).default({}),
  description: z.record(z.any()).default({}),
  allowedMcpServerIds: allowedMcpServerIdsSchema,
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
