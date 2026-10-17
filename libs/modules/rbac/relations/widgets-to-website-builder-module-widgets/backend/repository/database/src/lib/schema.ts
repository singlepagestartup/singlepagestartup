import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { Table as Widget } from "@sps/rbac/models/widget/backend/repository/database";
import { Table as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/backend/repository/database";

export const moduleName = "rc";
export const table = "ws_to_we_br_me_ws_em4";

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
    websiteBuilderModuleWidgetId: pgCore
      .uuid("we_br_me_wt_id")
      .notNull()
      .references(() => WebsiteBuilderModuleWidget.id, { onDelete: "cascade" }),
  },
  (table) => ({
    aiChatContentSlot: pgCore
      .uniqueIndex("rbac_widget_ai_chat_content_slot")
      .on(table.widgetId)
      .where(sql`${table.variant} = 'ai-chat-content'`),
    ownerTarget: pgCore
      .unique()
      .on(table.widgetId, table.websiteBuilderModuleWidgetId),
  }),
);
