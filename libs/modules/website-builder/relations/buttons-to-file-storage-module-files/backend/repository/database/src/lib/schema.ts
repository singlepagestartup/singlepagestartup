import * as pgCore from "drizzle-orm/pg-core";
import { Table as Button } from "@sps/website-builder/models/button/backend/repository/database";
import { Table as FileStorageModuleFile } from "@sps/file-storage/models/file/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "bs_to_fe_se_me_fs_m3s";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  buttonId: pgCore
    .uuid("bn_id")
    .notNull()
    .references(() => Button.id, { onDelete: "cascade" }),
  fileStorageModuleFileId: pgCore
    .uuid("fe_se_me_fe_id")
    .notNull()
    .references(() => FileStorageModuleFile.id, { onDelete: "cascade" }),
});
