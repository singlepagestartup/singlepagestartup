import * as pgCore from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { Table as Widget } from "@sps/sps-website-builder-models-widget-backend-schema-table";

export const schemaName = "SPSWBWidgetsToSpsRbacModuleWidgets";
export const modelName = "widgetsToSpsRbacModuleWidgets";

const moduleName = "sps_w_b";
const table = "ws_to_ss_rc_me_ws_25m";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  widgetId: pgCore
    .uuid("wt_id")
    .notNull()
    .references(() => Widget.id, { onDelete: "cascade" }),
  spsRbacModuleWidgetId: pgCore.uuid("sps_rc_me_wt_id").notNull(),
});

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);