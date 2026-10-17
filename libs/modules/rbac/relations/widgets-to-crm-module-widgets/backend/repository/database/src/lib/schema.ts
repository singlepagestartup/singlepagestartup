import * as pgCore from "drizzle-orm/pg-core";
import { Table as Widget } from "@sps/rbac/models/widget/backend/repository/database";
import { Table as CrmModuleWidget } from "@sps/crm/models/widget/backend/repository/database";

export const moduleName = "rc";
export const table = "ws_to_cm_me_ws_l65";

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
    widgetId: pgCore
      .uuid("wt_id")
      .notNull()
      .references(() => Widget.id, { onDelete: "cascade" }),
    crmModuleWidgetId: pgCore
      .uuid("cm_me_wt_id")
      .notNull()
      .references(() => CrmModuleWidget.id, { onDelete: "cascade" }),
  },
  (table) => ({
    ownerTarget: pgCore.unique().on(table.widgetId, table.crmModuleWidgetId),
  }),
);
