import * as pgCore from "drizzle-orm/pg-core";
import { Table as Widget } from "@sps/host/models/widget/backend/repository/database";

export const moduleName = "sps_tm";
export const table = "ws_to_el_ws_v3b";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  widgetId: pgCore
    .uuid("wt_id")
    .notNull()
    .references(() => Widget.id, { onDelete: "cascade" }),
  externalModule: pgCore
    .text("external_module")
    .notNull()
    .default("website-builder"),
  externalWidgetId: pgCore.text("external_widget_id").notNull(),
});
