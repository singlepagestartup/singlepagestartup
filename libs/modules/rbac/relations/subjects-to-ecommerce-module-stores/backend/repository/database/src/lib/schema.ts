import * as pgCore from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as EcommerceModuleStore } from "@sps/ecommerce/models/store/backend/repository/database";

export const moduleName = "rc";
export const table = "ss_to_ee_me_ss_htr";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
    updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
    variant: pgCore.text("variant").notNull().default("default"),
    orderIndex: pgCore.integer("order_index").notNull().default(0),
    className: pgCore.text("class_name"),
    subjectId: pgCore
      .uuid("st_id")
      .notNull()
      .references(() => Subject.id, { onDelete: "cascade" }),
    ecommerceModuleStoreId: pgCore
      .uuid("ee_me_se_id")
      .notNull()
      .references(() => EcommerceModuleStore.id, { onDelete: "cascade" }),
  },
  (table) => [
    pgCore
      .uniqueIndex("rc_store_owner_unique")
      .on(table.ecommerceModuleStoreId)
      .where(sql`${table.variant} = 'owner'`),
  ],
);
