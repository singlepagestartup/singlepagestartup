import * as pg from "drizzle-orm/pg-core";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as Wallet } from "@sps/billing/models/wallet/backend/repository/database";
import { sql } from "drizzle-orm";
export const moduleName = "sps_rc";
export const table = "subject_wallet";

export const Table = pg.pgTable(
  "sps_rc_subject_wallet",
  {
    id: pg.uuid("id").primaryKey().defaultRandom(),
    createdAt: pg.timestamp("created_at").defaultNow().notNull(),
    updatedAt: pg.timestamp("updated_at").defaultNow().notNull(),
    variant: pg.text("variant").default("default").notNull(),
    subjectId: pg
      .uuid("subject_id")
      .notNull()
      .references(() => Subject.id, { onDelete: "cascade" }),
    billingModuleWalletId: pg
      .uuid("wallet_id")
      .notNull()
      .unique()
      .references(() => Wallet.id),
  },
  (t) => [
    pg
      .uniqueIndex("sps_rc_default_wallet_owner")
      .on(t.subjectId)
      .where(sql`${t.variant} = 'default'`),
  ],
);
