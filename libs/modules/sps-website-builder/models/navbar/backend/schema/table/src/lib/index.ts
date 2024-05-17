import * as pgCore from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const schemaName = "SPSWBNavbar";
export const modelName = "navbar";

const moduleName = "sps_w_b";
const table = "navbars";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
});

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);
