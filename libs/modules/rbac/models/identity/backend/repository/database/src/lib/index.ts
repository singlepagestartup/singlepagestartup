import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);
/**
 * An identity as an HTTP response carries it to a caller without the operator
 * secret (issue #270): the password hash, its salt and the password-reset code
 * are left out. The API configuration applies it at the REST boundary, and the
 * SDK model derives its wire type from it, so both follow this one list.
 */
export const outputSchema = selectSchema.omit({
  password: true,
  salt: true,
  code: true,
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
