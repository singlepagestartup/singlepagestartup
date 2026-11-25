import * as pg from "drizzle-orm/pg-core";
import type {
  IProviderTerms,
  IProviderCapability,
  IProviderType,
} from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";

import type {
  ICustomerWorkCartSelection,
  ICustomerWorkReply,
  ICustomerWorkSourceVersion,
} from "@sps/rbac/models/subject/sdk/model";

export type TAttemptState =
  | "reserved"
  | "dispatching"
  | "unknown"
  | "received"
  | "settled"
  | "delivered"
  | "failed"
  | "stale";
export interface IWorkResult {
  providerRequestId: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    audioSeconds?: string;
    usd: string;
    basis: "provider" | "rate-card" | "owner-statement";
  };
  text: string;
  actionId?: string;
  cartSelection?: ICustomerWorkCartSelection;
  releaseOrderFile?: ICustomerWorkReply["releaseOrderFile"];
  embeddings?: { model: string; dimensions: number; values: number[][] };
  indexing?: { sourceId: string; contentHash: string; indexKey: string };
  artifact?: {
    originalFileId: string;
    previewFileId: string;
    publicationId: string;
  };
}

export interface IWorkBudget {
  stageAmount?: string;
  taskAmount?: string;
  runAmount?: string;
}

export const fields = {
  id: pg.uuid("id").primaryKey().defaultRandom(),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: pg
    .timestamp("updated_at", { withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
  storeId: pg.uuid("store_id").notNull(),
  taskId: pg.uuid("task_id").notNull(),
  sourceVersions: pg
    .jsonb("source_versions")
    .$type<ICustomerWorkSourceVersion[]>()
    .default([])
    .notNull(),
  eventId: pg.uuid("event_id").notNull(),
  stepKey: pg.text("step_key").notNull().default("reply"),
  requestDigest: pg.text("request_digest"),
  publicationId: pg.uuid("publication_id"),
  assigneeId: pg.uuid("assignee_id").notNull(),
  assignmentRevision: pg.integer("assignment_revision").notNull(),
  stageId: pg.text("stage_id").notNull(),
  capability: pg.text("capability").$type<IProviderCapability>().notNull(),
  executorId: pg.uuid("executor_id"),
  payerId: pg.uuid("payer_id").notNull(),
  ownerId: pg.uuid("owner_id").notNull(),
  currencyId: pg.uuid("currency_id").notNull(),
  connectionId: pg.uuid("connection_id"),
  identityId: pg.uuid("identity_id"),
  credentialVersion: pg.uuid("credential_version"),
  providerMode: pg
    .text("provider_mode", { enum: ["identity", "server"] })
    .notNull()
    .default("identity"),
  provider: pg.text("provider").$type<IProviderType>().notNull(),
  externalAccount: pg.text("external_account").notNull(),
  model: pg.text("model").notNull(),
  terms: pg.jsonb("terms").$type<IProviderTerms>().notNull(),
  maximum: pg.numeric("maximum", { precision: 38, scale: 12 }).notNull(),
  budget: pg.jsonb("budget").$type<IWorkBudget>(),
  state: pg.text("state").$type<TAttemptState>().notNull(),
  result: pg.jsonb("result").$type<IWorkResult>(),
  providerRequestId: pg.text("provider_request_id"),
  workReceiptId: pg.uuid("work_receipt_id"),
  expenseReceiptId: pg.uuid("expense_receipt_id"),
};
