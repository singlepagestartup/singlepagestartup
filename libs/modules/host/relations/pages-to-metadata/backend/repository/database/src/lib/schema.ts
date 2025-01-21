import * as pgCore from "drizzle-orm/pg-core";
import { Table as Page } from "@sps/host/models/page/backend/repository/database";
import { Table as Metadata } from "@sps/host/models/metadata/backend/repository/database";

export const moduleName = "sps_h";
export const table = "ps_to_ma_4m4";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  pageId: pgCore
    .uuid("pe_id")
    .notNull()
    .references(() => Page.id, { onDelete: "cascade" }),
  metadataId: pgCore
    .uuid("ma_id")
    .notNull()
    .references(() => Metadata.id, { onDelete: "cascade" }),
});
