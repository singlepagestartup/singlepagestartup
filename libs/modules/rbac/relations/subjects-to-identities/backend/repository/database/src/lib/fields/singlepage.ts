import { Table as Identity } from "@sps/rbac/models/identity/backend/repository/database";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  storeId: pgCore.uuid("store_id").references(() => Store.id),
  ownerId: pgCore.uuid("owner_id").references(() => Subject.id),
  label: pgCore.text("label"),
  externalAccount: pgCore.text("external_account"),
  version: pgCore.uuid("version"),
  active: pgCore.boolean("active"),
  capability: pgCore.text("capability"),
  model: pgCore.text("model"),
  terms: pgCore.jsonb("terms"),
  subjectId: pgCore
    .uuid("st_id")
    .notNull()
    .references(() => Subject.id, { onDelete: "cascade" }),
  identityId: pgCore
    .uuid("iy_id")
    .notNull()
    .references(() => Identity.id, { onDelete: "cascade" }),
};
