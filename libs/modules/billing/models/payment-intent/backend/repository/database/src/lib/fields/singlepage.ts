import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  amount: pgCore.integer("amount").notNull().default(0),
  status: pgCore.text("status").notNull().default("requires_payment_method"),
  interval: pgCore.text("interval"),
  type: pgCore.text("type").notNull().default("one_off"),
};
