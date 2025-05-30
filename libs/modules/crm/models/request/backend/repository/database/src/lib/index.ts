import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";
import { z } from "zod";

export const insertSchema = createInsertSchema(Table).extend({
  payload: z.record(z.any()).default({}),
});
export const selectSchema = createSelectSchema(Table).extend({
  payload: z.record(z.any()).default({}),
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
