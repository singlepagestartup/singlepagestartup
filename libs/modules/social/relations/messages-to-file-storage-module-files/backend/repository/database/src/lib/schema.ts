import * as pgCore from "drizzle-orm/pg-core";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Table as FileStorageModuleFile } from "@sps/file-storage/models/file/backend/repository/database";

export const moduleName = "sl";
export const table = "ms_to_fe_se_me_fs_3v0";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  messageId: pgCore
    .uuid("me_id")
    .notNull()
    .references(() => Message.id, { onDelete: "cascade" }),
  fileStorageModuleFileId: pgCore
    .uuid("fe_se_me_fe_id")
    .notNull()
    .references(() => FileStorageModuleFile.id, { onDelete: "cascade" }),
});
