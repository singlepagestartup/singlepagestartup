import * as pgCore from "drizzle-orm/pg-core";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database/src/lib/schema";
import { Table as OrderWork } from "@sps/ecommerce/models/order-work/backend/repository/database/src/lib/schema";

export const moduleName = "sps_ee";
export const table = "orders_to_order_works";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
    orderId: pgCore
      .uuid("order_id")
      .notNull()
      .references(() => Order.id, { onDelete: "cascade" }),
    orderWorkId: pgCore
      .uuid("order_work_id")
      .notNull()
      .references(() => OrderWork.id, { onDelete: "restrict" }),
  },
  (t) => [
    pgCore.uniqueIndex("ee_orders_to_order_works_order").on(t.orderId),
    pgCore.uniqueIndex("ee_orders_to_order_works_work").on(t.orderWorkId),
  ],
);
