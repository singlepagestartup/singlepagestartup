import * as pgCore from "drizzle-orm/pg-core";
import { Table as Thread } from "@sps/social/models/thread/backend/repository/database";
import { Table as CrmModuleTask } from "@sps/crm/models/task/backend/repository/database";

export const moduleName = "sl";
export const table = "thread_to_crm_task";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  threadId: pgCore
    .uuid("thread_id")
    .notNull()
    .unique()
    .references(() => Thread.id, { onDelete: "restrict" }),
  crmModuleTaskId: pgCore
    .uuid("crm_task_id")
    .notNull()
    .unique()
    .references(() => CrmModuleTask.id, { onDelete: "restrict" }),
  consultationTaskId: pgCore
    .uuid("consultation_task_id")
    .references(() => CrmModuleTask.id, { onDelete: "restrict" }),
  memoryProjectId: pgCore
    .uuid("memory_project_id")
    .references(() => Thread.id, { onDelete: "set null" }),
});
