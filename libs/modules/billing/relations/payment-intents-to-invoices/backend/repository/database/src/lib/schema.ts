import * as pgCore from "drizzle-orm/pg-core";
import { Table as Invoice } from "@sps/billing/models/invoice/backend/repository/database";
import { Table as PaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";

export const moduleName = "sps_bg";
export const table = "pt_is_to_is_lbb";

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
  invoiceId: pgCore
    .uuid("ie_id")
    .notNull()
    .references(() => Invoice.id, { onDelete: "cascade" }),
});
