import * as pg from "drizzle-orm/pg-core";
import { Table as Transaction } from "@sps/billing/models/transaction/backend/repository/database";
import { Table as Wallet } from "@sps/billing/models/wallet/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";

export const moduleName = "sps_bg";
export const table = "transaction_wallet";
export const Table = pg.pgTable(
  "sps_bg_transaction_wallet",
  {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    createdAt: pg.timestamp("created_at").defaultNow().notNull(),
    updatedAt: pg.timestamp("updated_at").defaultNow().notNull(),
    transactionId: pg
      .uuid("transaction_id")
      .notNull()
      .unique()
      .references(() => Transaction.id, { onDelete: "cascade" }),
    senderWalletId: pg
      .uuid("sender_wallet_id")
      .notNull()
      .references(() => Wallet.id),
    recipientWalletId: pg
      .uuid("recipient_wallet_id")
      .notNull()
      .references(() => Wallet.id),
    advanceRecipientWalletId: pg
      .uuid("advance_recipient_wallet_id")
      .references(() => Wallet.id),
    currencyId: pg
      .uuid("currency_id")
      .notNull()
      .references(() => Currency.id),
  },
  (t) => [
    pg
      .index("sps_bg_transaction_sending_wallet")
      .on(t.senderWalletId, t.currencyId),
  ],
);
