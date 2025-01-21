import * as pgCore from "drizzle-orm/pg-core";
import { Table as Widget } from "@sps/website-builder/models/widget/backend/repository/database";
import { Table as Feature } from "@sps/website-builder/models/feature/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "ws_to_fs_c2d";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  variant: pgCore.text("variant").notNull().default("default"),
  className: pgCore.text("class_name"),
  widgetId: pgCore
    .uuid("wt_id")
    .notNull()
    .references(() => Widget.id, { onDelete: "cascade" }),
  featureId: pgCore
    .uuid("fe_id")
    .notNull()
    .references(() => Feature.id, { onDelete: "cascade" }),
});
