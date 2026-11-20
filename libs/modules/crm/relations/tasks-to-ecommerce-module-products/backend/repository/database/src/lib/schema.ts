import * as pgCore from "drizzle-orm/pg-core";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database/src/lib/schema";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "tasks_to_products";
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
    productId: pgCore
      .uuid("product_id")
      .notNull()
      .references(() => Product.id, { onDelete: "cascade" }),
  },
  (t) => [
    pgCore.uniqueIndex("cm_tasks_to_products_owner").on(t.taskId),
    pgCore.index("cm_tasks_to_products_target").on(t.productId),
  ],
);
