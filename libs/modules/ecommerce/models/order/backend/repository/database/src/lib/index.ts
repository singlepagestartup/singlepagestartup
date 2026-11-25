import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

export const insertSchema = createInsertSchema(Table).omit({
  fulfillmentWork: true,
});
export const selectSchema = createSelectSchema(Table).omit({
  fulfillmentWork: true,
});
export type ISelectSchema = Omit<typeof Table.$inferSelect, "fulfillmentWork">;
export type IInsertSchema = Omit<typeof Table.$inferInsert, "fulfillmentWork">;
export const dataDirectory = `${__dirname}/data`;
