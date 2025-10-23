import * as pgCore from "drizzle-orm/pg-core";
import { Table as Option } from "@sps/crm/models/option/backend/repository/database";
import { Table as FileStorage } from "@sps/file-storage/models/file/backend/repository/database";

export const moduleName = "cm";
export const table = "os_to_fs_se_me_fe_gwo";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  optionId: pgCore
    .uuid("on_id")
    .notNull()
    .references(() => Option.id, { onDelete: "cascade" }),
  fileStorageModuleFileId: pgCore
    .uuid("fe_se_me_fe_id")
    .notNull()
    .references(() => FileStorage.id, { onDelete: "cascade" }),
});
