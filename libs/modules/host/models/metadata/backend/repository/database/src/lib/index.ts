import { metadataMaskSchema } from "@sps/shared-utils/metadata";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export * from "./schema";
import { Table } from "./schema";

export const insertSchema = createInsertSchema(Table, {
  title: metadataMaskSchema,
  description: metadataMaskSchema.nullable().optional(),
  keywords: metadataMaskSchema.nullable().optional(),
  author: metadataMaskSchema.nullable().optional(),
  opengraphImage: metadataMaskSchema.nullable().optional(),
  twitterImage: metadataMaskSchema.nullable().optional(),
  opengraphTitle: metadataMaskSchema.nullable().optional(),
  opengraphDescription: metadataMaskSchema.nullable().optional(),
  opengraphUrl: metadataMaskSchema.nullable().optional(),
  opengraphSiteName: metadataMaskSchema.nullable().optional(),
  twitterTitle: metadataMaskSchema.nullable().optional(),
  twitterDescription: metadataMaskSchema.nullable().optional(),
  twitterSite: metadataMaskSchema.nullable().optional(),
  twitterCreator: metadataMaskSchema.nullable().optional(),
  opengraphLocale: metadataMaskSchema.nullable().optional(),
});
export const selectSchema = createSelectSchema(Table);
export type ISelectSchema = typeof Table.$inferSelect;
export type IInsertSchema = typeof Table.$inferInsert;
export const dataDirectory = `${__dirname}/data`;
