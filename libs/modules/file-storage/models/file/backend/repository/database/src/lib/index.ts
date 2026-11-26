import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";
import { z } from "zod";

export const insertSchema = createInsertSchema(Table, {
  file: z.custom<File>((v) => v instanceof File).or(z.string()),
}).omit({ privateDigest: true, legacyOriginId: true, privateOwnerId: true });
export const selectSchema = createSelectSchema(Table).omit({
  privateDigest: true,
  legacyOriginId: true,
  privateOwnerId: true,
});
export type ISelectSchema = Omit<
  typeof Table.$inferSelect,
  "privateDigest" | "legacyOriginId" | "privateOwnerId"
>;
export type IInsertSchema = Omit<
  typeof Table.$inferInsert,
  "privateDigest" | "legacyOriginId" | "privateOwnerId"
>;
export const dataDirectory = `${__dirname}/data`;
