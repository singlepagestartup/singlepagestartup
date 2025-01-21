import * as pgCore from "drizzle-orm/pg-core";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "ps_to_as_c2s";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  productId: pgCore
    .uuid("pt_id")
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
  attributeId: pgCore
    .uuid("ae_id")
    .notNull()
    .references(() => Attribute.id, { onDelete: "cascade" }),
});
