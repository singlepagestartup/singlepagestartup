import * as pgCore from "drizzle-orm/pg-core";
import { Table as Logotype } from "@sps/website-builder/models/logotype/backend/repository/database";
import { Table as FileStorageModuleWidget } from "@sps/file-storage/models/widget/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "ls_to_ss_fe_se_ws_uas";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  logotypeId: pgCore
    .uuid("le_id")
    .notNull()
    .references(() => Logotype.id, { onDelete: "cascade" }),
  fileStorageModuleWidgetId: pgCore
    .uuid("sps_fe_se_wt_id")
    .notNull()
    .references(() => FileStorageModuleWidget.id, { onDelete: "cascade" }),
});
