import * as pgCore from "drizzle-orm/pg-core";
import { Table as Channel } from "@sps/broadcast/models/channel/backend/repository/database";
import { Table as Message } from "@sps/broadcast/models/message/backend/repository/database";

export const moduleName = "sps_bt";
export const table = "cs_to_ms_34z";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  channelId: pgCore
    .uuid("cl_id")
    .notNull()
    .references(() => Channel.id, { onDelete: "cascade" }),
  messageId: pgCore
    .uuid("me_id")
    .notNull()
    .references(() => Message.id, { onDelete: "cascade" }),
});
