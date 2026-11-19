import * as pgCore from "drizzle-orm/pg-core";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database/src/lib/schema";
import { Table as Event } from "@sps/crm/models/task-event/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "tasks_to_events";
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
    eventId: pgCore
      .uuid("event_id")
      .notNull()
      .references(() => Event.id, { onDelete: "restrict" }),
  },
  (t) => [
    pgCore.uniqueIndex("cm_tasks_to_events_owner").on(t.eventId),
    pgCore.index("cm_tasks_to_events_target").on(t.taskId),
  ],
);
