import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);
export const outputSchema = selectSchema.omit({
  checkoutProvider: true,
  checkoutCurrencyId: true,
  checkoutMetadata: true,
  checkoutDispatchState: true,
  checkoutDispatchStartedAt: true,
});
export const privateCheckoutFields = Object.keys(selectSchema.shape).filter(
  (field) => !(field in outputSchema.shape),
);
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
