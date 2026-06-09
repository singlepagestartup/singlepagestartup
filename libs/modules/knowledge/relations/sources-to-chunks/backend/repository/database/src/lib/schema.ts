import * as pgCore from "drizzle-orm/pg-core";
import { Table as Source } from "@sps/knowledge/models/source/backend/repository/database";
import { Table as Chunk } from "@sps/knowledge/models/chunk/backend/repository/database";

export const moduleName = "sps_ke";
export const table = "ss_to_cs_rae";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  sourceId: pgCore
    .uuid("se_id")
    .notNull()
    .references(() => Source.id, { onDelete: "cascade" }),
  chunkId: pgCore
    .uuid("ck_id")
    .notNull()
    .references(() => Chunk.id, { onDelete: "cascade" }),
});
