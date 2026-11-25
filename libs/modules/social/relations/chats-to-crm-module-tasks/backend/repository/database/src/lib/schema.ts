import { Table as Thread } from "@sps/social/models/thread/backend/repository/database";
import * as pgCore from "drizzle-orm/pg-core";
import { Table as Chat } from "@sps/social/models/chat/backend/repository/database";
import { Table as CrmModuleTask } from "@sps/crm/models/task/backend/repository/database";

export const moduleName = "sl";
export const table = "chat_to_crm_task";
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
    chatId: pgCore
      .uuid("chat_id")
      .notNull()
      .references(() => Chat.id, { onDelete: "cascade" }),
    crmModuleTaskId: pgCore
      .uuid("crm_task_id")
      .notNull()
      .references(() => CrmModuleTask.id, { onDelete: "cascade" }),
    consultationTaskId: pgCore
      .uuid("consultation_task_id")
      .references(() => CrmModuleTask.id, { onDelete: "set null" }),
    memoryProjectId: pgCore
      .uuid("memory_project_id")
      .references(() => Thread.id, { onDelete: "set null" }),
  },
  (row) => [
    pgCore.uniqueIndex("sl_chat_task_pair").on(row.chatId, row.crmModuleTaskId),
    pgCore.index("sl_task_chat_lookup").on(row.crmModuleTaskId),
  ],
);
