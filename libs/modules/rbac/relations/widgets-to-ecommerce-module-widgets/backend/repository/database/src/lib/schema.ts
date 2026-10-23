import * as pgCore from "drizzle-orm/pg-core";
import { Table as Widget } from "@sps/rbac/models/widget/backend/repository/database";
import { Table as EcommerceModuleWidget } from "@sps/ecommerce/models/widget/backend/repository/database";

export const moduleName = "rc";
export const table = "ws_to_em_me_ws_c76";

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
    ecommerceModuleWidgetId: pgCore
      .uuid("em_me_wt_id")
      .notNull()
      .references(() => EcommerceModuleWidget.id, { onDelete: "cascade" }),
  },
  (table) => ({
    ownerTarget: pgCore
      .unique()
      .on(table.widgetId, table.ecommerceModuleWidgetId),
  }),
);
