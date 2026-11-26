import * as pgCore from "drizzle-orm/pg-core";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as CrmModuleTask } from "@sps/crm/models/task/backend/repository/database";

export const moduleName = "rc";
export const table = "subject_to_crm_task";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
    updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
    variant: pgCore.text("variant").notNull().default("default"),
    orderIndex: pgCore.integer("order_index").notNull().default(0),
    className: pgCore.text("class_name"),
    subjectId: pgCore
      .uuid("subject_id")
      .notNull()
      .references(() => Subject.id, { onDelete: "cascade" }),
    crmModuleTaskId: pgCore
      .uuid("crm_task_id")
      .notNull()
      .references(() => CrmModuleTask.id, { onDelete: "cascade" }),
  },
  (row) => [
    pgCore
      .uniqueIndex("rc_task_subject_role")
      .on(row.crmModuleTaskId, row.variant),
    pgCore.index("rc_subject_tasks").on(row.subjectId, row.variant),
  ],
);
