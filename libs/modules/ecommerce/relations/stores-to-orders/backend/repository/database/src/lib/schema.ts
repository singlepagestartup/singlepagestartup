import * as pgCore from "drizzle-orm/pg-core";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "ss_to_os_v03";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  storeId: pgCore
    .uuid("se_id")
    .notNull()
    .references(() => Store.id, { onDelete: "cascade" }),
  orderId: pgCore
    .uuid("or_id")
    .notNull()
    .references(() => Order.id, { onDelete: "cascade" }),
});
