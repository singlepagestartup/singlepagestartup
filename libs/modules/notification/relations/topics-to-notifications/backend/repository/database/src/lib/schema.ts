import * as pgCore from "drizzle-orm/pg-core";
import { Table as Topic } from "@sps/notification/models/topic/backend/repository/database";
import { Table as Notification } from "@sps/notification/models/notification/backend/repository/database";

export const moduleName = "sps_nn";
export const table = "ts_to_ns_v8d";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  topicId: pgCore
    .uuid("tc_id")
    .notNull()
    .references(() => Topic.id, { onDelete: "cascade" }),
  notificationId: pgCore
    .uuid("nn_id")
    .notNull()
    .references(() => Notification.id, { onDelete: "cascade" }),
});
