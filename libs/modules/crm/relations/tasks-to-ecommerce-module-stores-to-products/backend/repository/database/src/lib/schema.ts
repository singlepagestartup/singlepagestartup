import * as pgCore from "drizzle-orm/pg-core";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database/src/lib/schema";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "tasks_to_offers";
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
    offerId: pgCore
      .uuid("offer_id")
      .notNull()
      .references(() => Offer.id, { onDelete: "cascade" }),
  },
  (t) => [
    pgCore.uniqueIndex("cm_tasks_to_offers_pair").on(t.taskId, t.offerId),
    pgCore.index("cm_tasks_to_offers_target").on(t.offerId),
  ],
);
