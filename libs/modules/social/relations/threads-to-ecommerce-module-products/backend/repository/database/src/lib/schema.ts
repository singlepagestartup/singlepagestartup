import * as pgCore from "drizzle-orm/pg-core";
import { Table as thread } from "@sps/social/models/thread/backend/repository/database";
import { Table as EcommerceModuleProduct } from "@sps/ecommerce/models/product/backend/repository/database";

export const moduleName = "sl";
export const table = "ts_to_ee_me_ps_b32";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  threadId: pgCore
    .uuid("td_id")
    .notNull()
    .references(() => thread.id, { onDelete: "cascade" }),
  ecommerceModuleProductId: pgCore
    .uuid("ee_me_pt_id")
    .notNull()
    .references(() => EcommerceModuleProduct.id, { onDelete: "cascade" }),
});
