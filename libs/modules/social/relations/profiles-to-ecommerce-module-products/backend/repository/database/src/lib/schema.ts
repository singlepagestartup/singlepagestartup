import * as pgCore from "drizzle-orm/pg-core";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as EcommerceModuleProduct } from "@sps/ecommerce/models/product/backend/repository/database";

export const moduleName = "sl";
export const table = "pe_to_ee_me_ps_4b2";

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
  ecommerceModuleProductId: pgCore
    .uuid("ee_me_pt_id")
    .notNull()
    .references(() => EcommerceModuleProduct.id, { onDelete: "cascade" }),
});
