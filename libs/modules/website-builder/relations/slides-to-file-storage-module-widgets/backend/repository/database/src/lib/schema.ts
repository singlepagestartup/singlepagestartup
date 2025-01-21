import * as pgCore from "drizzle-orm/pg-core";
import { Table as Slide } from "@sps/website-builder/models/slide/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "ss_to_ss_fe_se_ws_ekr";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  slideId: pgCore
    .uuid("se_id")
    .notNull()
    .references(() => Slide.id, { onDelete: "cascade" }),
  fileStorageModuleWidgetId: pgCore.uuid("sps_fe_se_wt_id").notNull(),
});
