import * as pgCore from "drizzle-orm/pg-core";
import { Table as ContentBlock } from "@sps/website-builder/models/content-block/backend/repository/database";
import { Table as ButtonsArray } from "@sps/website-builder/models/buttons-array/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "ct_bs_to_bs_as_pmd";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  contentBlockId: pgCore
    .uuid("ct_bk_id")
    .notNull()
    .references(() => ContentBlock.id, { onDelete: "cascade" }),
  buttonsArrayId: pgCore
    .uuid("by_id")
    .notNull()
    .references(() => ButtonsArray.id, { onDelete: "cascade" }),
});
