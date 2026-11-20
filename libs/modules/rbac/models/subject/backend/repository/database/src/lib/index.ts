import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

const privateSocialReadState = {
  socialThreadReadCursors: true,
  socialThreadReadsSince: true,
} as const;
export const insertSchema = createInsertSchema(Table).omit(
  privateSocialReadState,
);
export const selectSchema = createSelectSchema(Table).omit(
  privateSocialReadState,
);
export type ISelectSchema = Omit<
  typeof Table.$inferSelect,
  keyof typeof privateSocialReadState
>;
export type IInsertSchema = Omit<
  typeof Table.$inferInsert,
  keyof typeof privateSocialReadState
>;
export const dataDirectory = `${__dirname}/data`;
