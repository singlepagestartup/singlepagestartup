import * as pgCore from "drizzle-orm/pg-core";
import { Table as Page } from "@sps/sps-host/models/page/backend/repository/database";
import { Table as Widget } from "@sps/sps-host/models/widget/backend/repository/database";

export const moduleName = "sps_h";
export const table = "ps_to_ws_xyv";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  pageId: pgCore
    .uuid("pe_id")
    .notNull()
    .references(() => Page.id, { onDelete: "cascade" }),
  widgetId: pgCore
    .uuid("wt_id")
    .notNull()
    .references(() => Widget.id, { onDelete: "cascade" }),
});
