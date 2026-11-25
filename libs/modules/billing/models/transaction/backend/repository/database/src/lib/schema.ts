import * as pg from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const moduleName = "sps_bg";
export const table = "transaction";

export interface IProviderWork {
  attemptId: string;
  stepKey?: string;
  eventId?: string;
  publicationId?: string;
  providerMode?: "identity" | "server";
  executorId?: string;
  connectionId?: string;
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
  audioSeconds?: string;
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
  providerSubjectId?: string;
  workAmount: string;
  providerAmount?: string;
}
export const Table = pg.pgTable(
  "sps_bg_transaction",
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
    storeId: pg.uuid("store_id").notNull(),
    taskId: pg.uuid("task_id").notNull(),
    actorId: pg.uuid("actor_id").notNull(),
    senderId: pg.uuid("sender_id").notNull(),
    recipientId: pg.uuid("recipient_id").notNull(),
    currencyId: pg.uuid("currency_id").notNull(),
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
    advanceRecipientId: pg.uuid("advance_recipient_id"),
    providerWork: pg.jsonb("provider_work").$type<IProviderWork>(),
    settlement: pg.jsonb("settlement").$type<ISettlementTerms>(),
    eventId: pg.uuid("event_id"),
    stageId: pg.text("stage_id"),
    runBudget: pg.numeric("run_budget", { precision: 38, scale: 12 }),
    budget: pg.numeric("budget", { precision: 38, scale: 12 }),
  },
  (t) => [
    pg.uniqueIndex("sps_bg_transaction_key").on(t.storeId, t.operationKey),
    pg
      .index("sps_bg_wallet_active_reserves")
      .on(t.senderId, t.currencyId)
      .where(sql`${t.state} = 'held'`),
    pg.index("sps_bg_wallet_task").on(t.storeId, t.taskId, t.createdAt),
    pg.check(
      "sps_bg_advance_maximum",
      sql`${t.advanceAmount} >= 0 AND ${t.advanceAmount} <= ${t.amount}`,
    ),
    pg.index("sps_bg_wallet_settlement").on(t.reservationId),
    pg.check(
      "sps_bg_wallet_amount_positive",
      sql`${t.amount} > 0 AND (${t.budget} IS NULL OR ${t.budget} >= ${t.amount})`,
    ),
    pg.check(
      "sps_bg_wallet_distinct_parties",
      sql`${t.senderId} <> ${t.recipientId}`,
    ),
    pg.check(
      "sps_bg_wallet_valid_kind",
      sql`(${t.kind} = 'reserve' AND ${t.state} IN ('held','released','settled')) OR (${t.kind} = 'transfer' AND ${t.state} = 'posted' AND ${t.budget} IS NULL)`,
    ),
  ],
);
