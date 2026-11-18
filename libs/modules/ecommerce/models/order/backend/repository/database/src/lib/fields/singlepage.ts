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
  paymentFailureCanceledAt: pgCore.timestamp("payment_failure_canceled_at"),
  subscriptionSourceOrderId: pgCore.uuid("subscription_source_order_id"),
  subscriptionSourceInvoiceId: pgCore.uuid("subscription_source_invoice_id"),
  subscriptionSourceInterval: pgCore.text("subscription_source_interval"),
  subscriptionScheduledStartsAt: pgCore.timestamp(
    "subscription_scheduled_starts_at",
  ),
  subscriptionScheduledEndsAt: pgCore.timestamp(
    "subscription_scheduled_ends_at",
  ),
  subscriptionProviderInvoiceId: pgCore.text(
    "subscription_provider_invoice_id",
  ),
};
