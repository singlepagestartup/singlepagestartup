import * as pgCore from "drizzle-orm/pg-core";
import { Table as Attribute } from "@sps/social/models/attribute/backend/repository/database";
import { Table as AttributeKey } from "@sps/social/models/attribute-key/backend/repository/database";

export const moduleName = "sl";
export const table = "ae_ks_to_as_b02";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  attributeKeyId: pgCore
    .uuid("ae_ky_id")
    .notNull()
    .references(() => AttributeKey.id, { onDelete: "cascade" }),
  attributeId: pgCore
    .uuid("ae_id")
    .notNull()
    .references(() => Attribute.id, { onDelete: "cascade" }),
});
