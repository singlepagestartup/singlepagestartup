import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";
import { z } from "zod";

export const insertSchema = createInsertSchema(Table, {
  date: z
    .string()
    .nullable()
    .refine((val) => val && /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Invalid date format, expected YYYY-MM-DD",
    })
    .refine((val) => val && !isNaN(Date.parse(val)), {
      message: "Invalid date",
    })
    .transform((val) => (val ? new Date(val) : null)),
  datetime: z
    .string()
    .nullable()
    .refine((val) => val && !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .transform((val) => (val ? new Date(val) : null)),
});
export const selectSchema = createSelectSchema(Table);
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
