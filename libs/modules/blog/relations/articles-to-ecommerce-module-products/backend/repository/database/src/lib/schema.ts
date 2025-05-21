import * as pgCore from "drizzle-orm/pg-core";
import { Table as Article } from "@sps/blog/models/article/backend/repository/database";
import { Table as EcommerceModuleProduct } from "@sps/ecommerce/models/product/backend/repository/database";

export const moduleName = "bg";
export const table = "as_to_ee_me_ps_bd9";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  articleId: pgCore
    .uuid("ae_id")
    .notNull()
    .references(() => Article.id, { onDelete: "cascade" }),
  ecommerceModuleProductId: pgCore
    .uuid("ee_me_pt_id")
    .notNull()
    .references(() => EcommerceModuleProduct.id, { onDelete: "cascade" }),
});
