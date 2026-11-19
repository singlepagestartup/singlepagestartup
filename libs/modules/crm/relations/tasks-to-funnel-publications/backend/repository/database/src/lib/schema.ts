import * as pgCore from "drizzle-orm/pg-core";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database/src/lib/schema";
import { Table as Publication } from "@sps/crm/models/funnel-publication/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "tasks_to_publications";
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
    publicationId: pgCore
      .uuid("publication_id")
      .notNull()
      .references(() => Publication.id, { onDelete: "restrict" }),
  },
  (t) => [
    pgCore.uniqueIndex("cm_tasks_to_publications_owner").on(t.taskId),
    pgCore.index("cm_tasks_to_publications_target").on(t.publicationId),
  ],
);
