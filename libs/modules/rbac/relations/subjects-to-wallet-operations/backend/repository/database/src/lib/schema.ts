import * as pg from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";

export const moduleName = "sps_rc";
export const table = "wallet_operation";

export interface IProviderWork {
  attemptId: string;
  executorId: string;
  connectionId: string;
  provider: "openrouter" | "openai";
  externalAccount: string;
  model: string;
  state:
    | "dispatching"
    | "unknown"
    | "received"
    | "settled"
    | "delivered"
    | "stale"
    | "failed";
  providerRequestId?: string;
  usd?: string;
  basis?: "provider" | "rate-card" | "owner-statement";
  inputTokens?: number;
  outputTokens?: number;
  reconcileRequested?: boolean;
  checkedAt?: string;
  uncoveredCostSps?: string;
  resolution?: (
    | { kind: "no-charge"; reference: string }
    | {
        kind: "charged";
        reference: string;
        usd: string;
        inputTokens: number;
        outputTokens: number;
      }
  ) & { actorId: string; recordedAt: string };
}
export interface ISettlementTerms {
  providerSubjectId: string;
  workAmount: string;
  providerAmount: string;
}
export const Table = pg.pgTable(
  "sps_rc_wallet_operation",
  {
    id: pg.uuid("id").primaryKey().defaultRandom(),
    createdAt: pg
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: pg
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    storeId: pg
      .uuid("store_id")
      .notNull()
      .references(() => Store.id),
    taskId: pg.uuid("task_id").notNull(),
    actorId: pg
      .uuid("actor_id")
      .notNull()
      .references(() => Subject.id),
    senderId: pg
      .uuid("sender_id")
      .notNull()
      .references(() => Subject.id),
    recipientId: pg
      .uuid("recipient_id")
      .notNull()
      .references(() => Subject.id),
    currencyId: pg
      .uuid("currency_id")
      .notNull()
      .references(() => Currency.id),
    operationKey: pg.text("operation_key").notNull(),
    reservationId: pg.uuid("reservation_id"),
    purpose: pg.text("purpose").notNull(),
    kind: pg.text("kind", { enum: ["reserve", "transfer"] }).notNull(),
    state: pg
      .text("state", { enum: ["held", "released", "settled", "posted"] })
      .notNull(),
    amount: pg.numeric("amount", { precision: 38, scale: 12 }).notNull(),
    advanceAmount: pg
      .numeric("advance_amount", { precision: 38, scale: 12 })
      .default("0")
      .notNull(),
    advanceRecipientId: pg
      .uuid("advance_recipient_id")
      .references(() => Subject.id),
    providerWork: pg.jsonb("provider_work").$type<IProviderWork>(),
    settlement: pg.jsonb("settlement").$type<ISettlementTerms>(),
    budget: pg.numeric("budget", { precision: 38, scale: 12 }),
  },
  (t) => [
    pg.uniqueIndex("sps_rc_wallet_operation_key").on(t.storeId, t.operationKey),
    pg
      .index("sps_rc_wallet_active_reserves")
      .on(t.senderId, t.currencyId)
      .where(sql`${t.state} = 'held'`),
    pg.index("sps_rc_wallet_task").on(t.storeId, t.taskId, t.createdAt),
    pg.check(
      "sps_rc_advance_maximum",
      sql`${t.advanceAmount} >= 0 AND ${t.advanceAmount} <= ${t.amount}`,
    ),
    pg.index("sps_rc_wallet_settlement").on(t.reservationId),
    pg.check(
      "sps_rc_wallet_amount_positive",
      sql`${t.amount} > 0 AND (${t.budget} IS NULL OR ${t.budget} >= ${t.amount})`,
    ),
    pg.check(
      "sps_rc_wallet_distinct_parties",
      sql`${t.senderId} <> ${t.recipientId}`,
    ),
    pg.check(
      "sps_rc_wallet_valid_kind",
      sql`(${t.kind} = 'reserve' AND ${t.state} IN ('held','released','settled') AND ${t.budget} IS NOT NULL) OR (${t.kind} = 'transfer' AND ${t.state} = 'posted' AND ${t.budget} IS NULL)`,
    ),
  ],
);
