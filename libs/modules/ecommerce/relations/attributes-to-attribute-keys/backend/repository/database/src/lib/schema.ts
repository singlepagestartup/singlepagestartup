import * as pgCore from "drizzle-orm/pg-core";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as AttributeKey } from "@sps/ecommerce/models/attribute-key/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "as_to_ae_ks_c4s";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  attributeId: pgCore
    .uuid("ae_id")
    .notNull()
    .references(() => Attribute.id, { onDelete: "cascade" }),
  attributeKeyId: pgCore
    .uuid("ae_ky_id")
    .notNull()
    .references(() => AttributeKey.id, { onDelete: "cascade" }),
});
