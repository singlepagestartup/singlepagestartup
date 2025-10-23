import * as pgCore from "drizzle-orm/pg-core";
import { Table as Step } from "@sps/crm/models/step/backend/repository/database";
import { Table as Input } from "@sps/crm/models/input/backend/repository/database";

export const moduleName = "cm";
export const table = "ss_to_is_5ac";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  stepId: pgCore
    .uuid("sp_id")
    .notNull()
    .references(() => Step.id, { onDelete: "cascade" }),
  inputId: pgCore
    .uuid("it_id")
    .notNull()
    .references(() => Input.id, { onDelete: "cascade" }),
});
