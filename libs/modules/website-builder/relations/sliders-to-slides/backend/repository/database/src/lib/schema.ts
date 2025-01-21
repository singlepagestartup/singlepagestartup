import * as pgCore from "drizzle-orm/pg-core";
import { Table as Slider } from "@sps/website-builder/models/slider/backend/repository/database";
import { Table as Slide } from "@sps/website-builder/models/slide/backend/repository/database";

export const moduleName = "sps_w_b";
export const table = "ss_to_ss";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  sliderId: pgCore
    .uuid("sr_id")
    .notNull()
    .references(() => Slider.id, { onDelete: "cascade" }),
  slideId: pgCore
    .uuid("se_id")
    .notNull()
    .references(() => Slide.id, { onDelete: "cascade" }),
});
