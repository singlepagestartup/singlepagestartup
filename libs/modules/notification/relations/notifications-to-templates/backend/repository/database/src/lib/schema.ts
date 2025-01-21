import * as pgCore from "drizzle-orm/pg-core";
import { Table as Template } from "@sps/notification/models/template/backend/repository/database";
import { Table as Notification } from "@sps/notification/models/notification/backend/repository/database";

export const moduleName = "sps_nn";
export const table = "ns_to_ts_g3c";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  notificationId: pgCore
    .uuid("nn_id")
    .notNull()
    .references(() => Notification.id, { onDelete: "cascade" }),
  templateId: pgCore
    .uuid("te_id")
    .notNull()
    .references(() => Template.id, { onDelete: "cascade" }),
});
