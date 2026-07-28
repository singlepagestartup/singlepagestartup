import { Table as Chat } from "@sps/social/models/chat/backend/repository/database";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  profileId: pgCore
    .uuid("pe_id")
    .notNull()
    .references(() => Profile.id, { onDelete: "cascade" }),
  chatId: pgCore
    .uuid("ct_id")
    .notNull()
    .references(() => Chat.id, { onDelete: "cascade" }),
};
