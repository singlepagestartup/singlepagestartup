import * as pgCore from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { fields } from "./fields";

export const schemaName = "SPSWBFeaturesSectionBlock";
export const modelName = "featuresSectionBlock";

const moduleName = "sps_w_b";
const table = "fs_sn_bk";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  ...fields,
  variant: pgCore.text("variant").notNull().default("default"),
});

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);
