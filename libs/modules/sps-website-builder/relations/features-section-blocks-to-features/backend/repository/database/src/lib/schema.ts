import * as pgCore from "drizzle-orm/pg-core";
import { Table as FeaturesSectionBlock } from "@sps/sps-website-builder/models/features-section-block/backend/repository/database";
import { Table as Feature } from "@sps/sps-website-builder/models/feature/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "fs_sn_bs_to_fs";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  variant: pgCore.text("variant").notNull().default("default"),
  className: pgCore.text("class_name"),
  featuresSectionBlockId: pgCore
    .uuid("fk_id")
    .notNull()
    .references(() => FeaturesSectionBlock.id, { onDelete: "cascade" }),
  featureId: pgCore
    .uuid("fe_id")
    .notNull()
    .references(() => Feature.id, { onDelete: "cascade" }),
});