import * as pgCore from "drizzle-orm/pg-core";
import { Table as ContentBlock } from "@sps/sps-website-builder/models/content-block/backend/repository/database";
import { Table as Slider } from "@sps/sps-website-builder/models/slider/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "ct_bs_to_ss";

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
  sliderId: pgCore
    .uuid("sr_id")
    .notNull()
    .references(() => Slider.id, { onDelete: "cascade" }),
});
