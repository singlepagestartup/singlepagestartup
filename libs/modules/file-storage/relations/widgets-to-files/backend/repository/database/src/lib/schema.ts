import * as pgCore from "drizzle-orm/pg-core";
import { Table as Widget } from "@sps/file-storage/models/widget/backend/repository/database";
import { Table as File } from "@sps/file-storage/models/file/backend/repository/database";

export const moduleName = "sps_f_s";
export const table = "ws_to_fs_ocw";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  widgetId: pgCore
    .uuid("wt_id")
    .notNull()
    .references(() => Widget.id, { onDelete: "cascade" }),
  fileId: pgCore
    .uuid("fe_id")
    .notNull()
    .references(() => File.id, { onDelete: "cascade" }),
});
