import * as pgCore from "drizzle-orm/pg-core";
import { Table as PaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";

export const moduleName = "sps_bg";
export const table = "pt_is_to_cs_cg0";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  paymentIntentId: pgCore
    .uuid("pt_it_id")
    .notNull()
    .references(() => PaymentIntent.id, { onDelete: "cascade" }),
  currencyId: pgCore
    .uuid("cy_id")
    .notNull()
    .references(() => Currency.id, { onDelete: "cascade" }),
});
