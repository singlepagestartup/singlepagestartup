import * as pgCore from "drizzle-orm/pg-core";
import { Table as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "ss_to_ps_to_as_v04";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  storesToProductsId: pgCore
    .uuid("ss_to_ps_id")
    .notNull()
    .references(() => StoresToProducts.id, { onDelete: "cascade" }),
  attributeId: pgCore
    .uuid("ae_id")
    .notNull()
    .references(() => Attribute.id, { onDelete: "cascade" }),
});
