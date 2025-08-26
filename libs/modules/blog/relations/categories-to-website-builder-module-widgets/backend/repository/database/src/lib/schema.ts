import * as pgCore from "drizzle-orm/pg-core";
import { Table as Category } from "@sps/blog/models/category/backend/repository/database";
import { Table as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/backend/repository/database";

export const moduleName = "sps_blog";
export const table = "cs_to_we_br_me_wt_7d2";

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
  websiteBuilderModuleWidgetId: pgCore
    .uuid("we_br_me_wt_id")
    .notNull()
    .references(() => WebsiteBuilderModuleWidget.id, { onDelete: "cascade" }),
});
