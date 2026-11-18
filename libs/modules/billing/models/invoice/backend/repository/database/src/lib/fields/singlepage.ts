import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  status: pgCore.text("status").notNull().default("draft"),
  paymentUrl: pgCore.text("payment_url").notNull().default(""),
  successUrl: pgCore.text("success_url").notNull().default(""),
  cancelUrl: pgCore.text("cancel_url").notNull().default(""),
  amount: pgCore
    .numeric("amount", { precision: 24, scale: 8, mode: "number" })
    .notNull()
    .default(0),
  providerId: pgCore.text("provider_id"),
  provider: pgCore.text("provider").default("stripe"),
};
