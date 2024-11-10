import * as pgCore from "drizzle-orm/pg-core";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "ss_to_as_cv3";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  storeId: pgCore
    .uuid("se_id")
    .notNull()
    .references(() => Store.id, { onDelete: "cascade" }),
  attributeId: pgCore
    .uuid("ae_id")
    .notNull()
    .references(() => Attribute.id, { onDelete: "cascade" }),
});
