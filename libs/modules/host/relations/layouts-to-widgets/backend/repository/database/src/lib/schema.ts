import * as pgCore from "drizzle-orm/pg-core";
import { Table as Layout } from "@sps/host/models/layout/backend/repository/database";
import { Table as Widget } from "@sps/host/models/widget/backend/repository/database";

export const moduleName = "sps_h";
export const table = "ls_to_ws_v2d";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  layoutId: pgCore
    .uuid("lt_id")
    .notNull()
    .references(() => Layout.id, { onDelete: "cascade" }),

  widgetId: pgCore
    .uuid("wt_id")
    .notNull()
    .references(() => Widget.id, { onDelete: "cascade" }),
});
