import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

const workerFields = {
  feedVisible: true,
  deliveryKey: true,
  receipt: true,
  claimedAt: true,
  startedAt: true,
  leaseUntil: true,
  finishedAt: true,
} as const;
export const insertSchema = createInsertSchema(Table).omit(workerFields);
export const selectSchema = createSelectSchema(Table).omit(workerFields);
export type ISelectSchema = Omit<
  typeof Table.$inferSelect,
  keyof typeof workerFields
>;
export type IInsertSchema = Omit<
  typeof Table.$inferInsert,
  keyof typeof workerFields
>;
export const dataDirectory = `${__dirname}/data`;
