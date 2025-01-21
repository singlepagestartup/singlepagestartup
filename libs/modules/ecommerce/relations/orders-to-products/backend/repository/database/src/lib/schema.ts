import * as pgCore from "drizzle-orm/pg-core";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "os_to_ps_d4c";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  quantity: pgCore.integer("quantity").notNull().default(1),
  className: pgCore.text("class_name"),
  orderId: pgCore
    .uuid("or_id")
    .notNull()
    .references(() => Order.id, { onDelete: "cascade" }),
  productId: pgCore
    .uuid("pt_id")
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
});
