import * as pgCore from "drizzle-orm/pg-core";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Table as CrmModuleTaskEvent } from "@sps/crm/models/task-event/backend/repository/database";

export const moduleName = "sl";
export const table = "message_to_crm_task_event";
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
    messageId: pgCore
      .uuid("message_id")
      .notNull()
      .unique()
      .references(() => Message.id, { onDelete: "restrict" }),
    crmModuleTaskEventId: pgCore
      .uuid("crm_task_event_id")
      .notNull()
      .unique()
      .references(() => CrmModuleTaskEvent.id, { onDelete: "restrict" }),
    pending: pgCore.boolean("pending").notNull().default(false),
  },
  (table) => [
    pgCore.index("sl_pending_crm_message").on(table.pending, table.createdAt),
  ],
);
