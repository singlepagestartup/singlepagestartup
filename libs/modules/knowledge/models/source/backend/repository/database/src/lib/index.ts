import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
