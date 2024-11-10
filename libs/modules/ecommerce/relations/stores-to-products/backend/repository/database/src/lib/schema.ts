import * as pgCore from "drizzle-orm/pg-core";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "ss_to_ps_vn7";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  storeId: pgCore
    .uuid("se_id")
    .notNull()
    .references(() => Store.id, { onDelete: "cascade" }),
  productId: pgCore
    .uuid("pt_id")
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
});
