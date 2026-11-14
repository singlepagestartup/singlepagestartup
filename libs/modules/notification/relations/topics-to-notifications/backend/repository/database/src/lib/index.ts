import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";
import { notificationIdSchema } from "@sps/notification/models/notification/backend/repository/database";

export const insertSchema = createInsertSchema(Table, {
  notificationId: notificationIdSchema,
});
export const selectSchema = createSelectSchema(Table, {
  notificationId: notificationIdSchema,
});
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
