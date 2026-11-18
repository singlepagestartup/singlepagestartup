import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  amount: pgCore
    .numeric("amount", { precision: 24, scale: 8, mode: "number" })
    .notNull()
    .default(0),
  status: pgCore.text("status").notNull().default("requires_payment_method"),
  interval: pgCore.text("interval"),
  type: pgCore.text("type").notNull().default("one_off"),
  checkoutProvider: pgCore.text("checkout_provider"),
  checkoutCurrencyId: pgCore.uuid("checkout_currency_id"),
  checkoutMetadata: pgCore
    .jsonb("checkout_metadata")
    .$type<Record<string, unknown>>(),
  checkoutDispatchState: pgCore
    .text("checkout_dispatch_state")
    .notNull()
    .default("legacy"),
  checkoutDispatchStartedAt: pgCore.timestamp("checkout_dispatch_started_at"),
};
