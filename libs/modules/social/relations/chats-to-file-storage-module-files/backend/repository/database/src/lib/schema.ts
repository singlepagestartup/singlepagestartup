import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { Table as Chat } from "@sps/social/models/chat/backend/repository/database";
import { Table as FileStorageModuleFile } from "@sps/file-storage/models/file/backend/repository/database";

export const moduleName = "sl";
export const table = "cs_to_fe_se_me_fs_d7x";

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
      .uuid("ct_id")
      .notNull()
      .references(() => Chat.id, { onDelete: "cascade" }),
    fileStorageModuleFileId: pgCore
      .uuid("fe_se_me_fe_id")
      .notNull()
      .references(() => FileStorageModuleFile.id, { onDelete: "cascade" }),
  },
  (row) => [
    pgCore
      .uniqueIndex("sl_chat_cover_file")
      .on(row.chatId)
      .where(sql`${row.variant} = 'cover'`),
  ],
);
