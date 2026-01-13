import * as pgCore from "drizzle-orm/pg-core";
import { Table as Permission } from "@sps/rbac/models/permission/backend/repository/database";
import { Table as BillingModuleCurrency } from "@sps/billing/models/currency/backend/repository/database";

export const moduleName = "sps_rc";
export const table = "ps_to_bg_me_cs_b24";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  amount: pgCore.text("amount").notNull().default("0"),
  permissionId: pgCore
    .uuid("pn_id")
    .notNull()
    .references(() => Permission.id, { onDelete: "cascade" }),
  billingModuleCurrencyId: pgCore
    .uuid("bg_me_cy_id")
    .notNull()
    .references(() => BillingModuleCurrency.id, { onDelete: "cascade" }),
});
