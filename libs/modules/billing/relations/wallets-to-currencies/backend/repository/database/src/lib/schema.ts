import * as pg from "drizzle-orm/pg-core";
import { Table as Wallet } from "@sps/billing/models/wallet/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";
export const moduleName = "sps_bg";
export const table = "wallet_currency";

export const Table = pg.pgTable(
  "sps_bg_wallet_currency",
  {
    id: pg.uuid("id").primaryKey().defaultRandom(),
    createdAt: pg.timestamp("created_at").defaultNow().notNull(),
    updatedAt: pg.timestamp("updated_at").defaultNow().notNull(),
    variant: pg.text("variant").default("default").notNull(),
    walletId: pg
      .uuid("wallet_id")
      .notNull()
      .references(() => Wallet.id),
    currencyId: pg
      .uuid("currency_id")
      .notNull()
      .references(() => Currency.id, { onDelete: "cascade" }),
    amount: pg.numeric("amount").notNull().default("0"),
    orderIndex: pg.integer("order_index").notNull().default(0),
    className: pg.text("class_name"),
  },
  (t) => [
    pg.index("sps_bg_wallet_currency_lookup").on(t.walletId, t.currencyId),
  ],
);
