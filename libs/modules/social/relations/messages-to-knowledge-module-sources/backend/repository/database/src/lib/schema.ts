import * as pgCore from "drizzle-orm/pg-core";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Table as Source } from "@sps/knowledge/models/source/backend/repository/database";

export const moduleName = "sl";
export const table = "ms_to_ke_me_sources";

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
    kind: pgCore.text("kind").notNull().default("origin"),
    messageId: pgCore
      .uuid("message_id")
      .notNull()
      .references(() => Message.id, { onDelete: "cascade" }),
    knowledgeModuleSourceId: pgCore
      .uuid("ke_me_se_id")
      .notNull()
      .references(() => Source.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pairUnique: pgCore
      .unique("sl_message_source_unique")
      .on(table.messageId, table.knowledgeModuleSourceId, table.kind),
  }),
);
