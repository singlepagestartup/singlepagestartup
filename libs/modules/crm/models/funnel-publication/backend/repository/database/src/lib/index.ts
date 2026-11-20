import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { Table } from "./schema";

export * from "./schema";

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);
export type IInsertSchema = typeof Table.$inferInsert;
export type ISelectSchema = typeof Table.$inferSelect;
export const dataDirectory = `${__dirname}/data`;
