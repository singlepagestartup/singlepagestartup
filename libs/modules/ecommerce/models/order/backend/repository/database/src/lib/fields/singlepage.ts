import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  status: pgCore.text("status").notNull().default("new"),
  type: pgCore.text("type").notNull().default("cart"),
  receipt: pgCore.text("receipt").notNull().default(""),
  comment: pgCore.text("comment"),
  subscriptionPeriodStartsAt: pgCore.timestamp("subscription_period_starts_at"),
  subscriptionPeriodEndsAt: pgCore.timestamp("subscription_period_ends_at"),
  subscriptionPeriodInvoiceId: pgCore.uuid("subscription_period_invoice_id"),
  subscriptionRevokedAt: pgCore.timestamp("subscription_revoked_at"),
};
