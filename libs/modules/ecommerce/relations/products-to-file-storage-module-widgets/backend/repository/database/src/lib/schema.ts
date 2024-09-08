import * as pgCore from "drizzle-orm/pg-core";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import { Table as FileStorageModuleWidget } from "@sps/file-storage/models/widget/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "ps_to_fe_se_me_ws_3cv";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  productId: pgCore
    .uuid("pt_id")
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
  fileStorageModuleWidgetId: pgCore
    .uuid("fe_se_me_wt_id")
    .notNull()
    .references(() => FileStorageModuleWidget.id, { onDelete: "cascade" }),
});
