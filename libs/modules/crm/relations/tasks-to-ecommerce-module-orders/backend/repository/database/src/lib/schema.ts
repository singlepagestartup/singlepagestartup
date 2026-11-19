import * as pgCore from "drizzle-orm/pg-core";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database/src/lib/schema";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "tasks_to_orders";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore
      .timestamp("created_at", { precision: 3 })
      .notNull()
      .defaultNow(),
    taskId: pgCore
      .uuid("task_id")
      .notNull()
      .references(() => Task.id, { onDelete: "restrict" }),
    orderId: pgCore
      .uuid("order_id")
      .notNull()
      .references(() => Order.id, { onDelete: "cascade" }),
  },
  (t) => [
    pgCore.uniqueIndex("cm_tasks_to_orders_owner").on(t.taskId),
    pgCore.index("cm_tasks_to_orders_target").on(t.orderId),
  ],
);
