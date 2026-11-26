import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database/src/lib/schema";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "funnels_to_tasks";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore
      .timestamp("created_at", { precision: 3 })
      .notNull()
      .defaultNow(),
    variant: pgCore
      .text("variant", { enum: ["primary", "related"] })
      .default("primary")
      .notNull(),
    funnelId: pgCore
      .uuid("funnel_id")
      .notNull()
      .references(() => Funnel.id, { onDelete: "restrict" }),
    taskId: pgCore
      .uuid("task_id")
      .notNull()
      .references(() => Task.id, { onDelete: "restrict" }),
  },
  (t) => [
    pgCore.check(
      "cm_funnels_to_tasks_variant",
      sql`${t.variant} in ('primary', 'related')`,
    ),
    pgCore.uniqueIndex("cm_funnels_to_tasks_pair").on(t.funnelId, t.taskId),
    pgCore
      .uniqueIndex("cm_funnels_to_tasks_primary")
      .on(t.taskId)
      .where(sql`${t.variant} = 'primary'`),
    pgCore.index("cm_funnels_to_tasks_task").on(t.taskId),
  ],
);
