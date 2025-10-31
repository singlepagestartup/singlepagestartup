import * as pgCore from "drizzle-orm/pg-core";
import { Table as Category } from "@sps/ecommerce/models/category/backend/repository/database";
import { Table as Widget } from "@sps/website-builder/models/widget/backend/repository/database";

export const moduleName = "ee";
export const table = "cs_to_we_br_me_ws_bfm";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  categoryId: pgCore
    .uuid("cy_id")
    .notNull()
    .references(() => Category.id, { onDelete: "cascade" }),
  widgetId: pgCore
    .uuid("wt_id")
    .notNull()
    .references(() => Widget.id, { onDelete: "cascade" }),
});
