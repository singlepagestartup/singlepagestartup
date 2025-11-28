import * as pgCore from "drizzle-orm/pg-core";
import { Table as Role } from "@sps/rbac/models/role/backend/repository/database";
import { Table as Action } from "@sps/rbac/models/action/backend/repository/database";

export const moduleName = "sps_rc";
export const table = "rs_to_as_mz2";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  roleId: pgCore
    .uuid("re_id")
    .notNull()
    .references(() => Role.id, { onDelete: "cascade" }),
  actionId: pgCore
    .uuid("an_id")
    .notNull()
    .references(() => Action.id, { onDelete: "cascade" }),
  condition: pgCore.text("condition"),
});
