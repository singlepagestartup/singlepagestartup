import { Table as Action } from "@sps/social/models/action/backend/repository/database";
import { Table as Thread } from "@sps/social/models/thread/backend/repository/database";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  threadId: pgCore
    .uuid("td_id")
    .notNull()
    .references(() => Thread.id, { onDelete: "cascade" }),
  actionId: pgCore
    .uuid("ac_id")
    .notNull()
    .references(() => Action.id, { onDelete: "cascade" }),
};
