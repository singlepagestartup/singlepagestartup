import * as pgCore from "drizzle-orm/pg-core";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as Action } from "@sps/social/models/action/backend/repository/database";

export const moduleName = "sl";
export const table = "ps_to_as_b33";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
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
  actionId: pgCore
    .uuid("an_id")
    .notNull()
    .references(() => Action.id, { onDelete: "cascade" }),
});
