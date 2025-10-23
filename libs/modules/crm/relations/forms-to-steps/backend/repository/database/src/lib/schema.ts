import * as pgCore from "drizzle-orm/pg-core";
import { Table as Form } from "@sps/crm/models/form/backend/repository/database";
import { Table as Step } from "@sps/crm/models/step/backend/repository/database";

export const moduleName = "cm";
export const table = "fs_to_ss_kqx";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  formId: pgCore
    .uuid("fm_id")
    .notNull()
    .references(() => Form.id, { onDelete: "cascade" }),
  stepId: pgCore
    .uuid("sp_id")
    .notNull()
    .references(() => Step.id, { onDelete: "cascade" }),
});
