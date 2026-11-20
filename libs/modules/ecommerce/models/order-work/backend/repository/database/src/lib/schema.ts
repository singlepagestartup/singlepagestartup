import * as pgCore from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type {
  IOrderPhysicalEvent,
  IOrderWorkDecision,
  IOrderWorkExpertArchive,
  IOrderWorkPayment,
  IOrderWorkVersion,
  TWorkFulfillmentState,
  TWorkKind,
} from "@sps/ecommerce/models/order-work/sdk/model/src/lib/work";

export const moduleName = "sps_ee";
export const table = "order_work";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore
      .timestamp("created_at", { precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: pgCore
      .timestamp("updated_at", { precision: 3 })
      .notNull()
      .defaultNow(),
    orderId: pgCore.uuid("order_id").notNull(),
    storeId: pgCore.uuid("store_id").notNull(),
    taskId: pgCore.uuid("task_id").notNull(),
    customerId: pgCore.uuid("customer_id").notNull(),
    kind: pgCore.text("kind").$type<TWorkKind>().notNull(),
    state: pgCore.text("state").$type<TWorkFulfillmentState>().notNull(),
    versions: pgCore
      .jsonb("versions")
      .$type<IOrderWorkVersion[]>()
      .notNull()
      .default([]),
    decisions: pgCore
      .jsonb("decisions")
      .$type<IOrderWorkDecision[]>()
      .notNull()
      .default([]),
    acceptedVersionId: pgCore.uuid("accepted_version_id"),
    paid: pgCore.jsonb("paid").$type<IOrderWorkPayment>(),
    expertArchive: pgCore
      .jsonb("expert_archive")
      .$type<IOrderWorkExpertArchive>(),
    deliveredAt: pgCore.timestamp("delivered_at", { precision: 3 }),
    receiptFileId: pgCore.uuid("receipt_file_id"),
    resultFileId: pgCore.uuid("result_file_id"),
    paidDispatchedAt: pgCore.timestamp("paid_dispatched_at", { precision: 3 }),
    fulfillment: pgCore
      .jsonb("fulfillment")
      .$type<IOrderPhysicalEvent[]>()
      .notNull()
      .default([]),
  },
  (t) => [
    pgCore.uniqueIndex("ee_order_work_order").on(t.orderId),
    pgCore.index("ee_order_work_customer").on(t.customerId, t.updatedAt.desc()),
    pgCore
      .index("ee_order_work_payment_outbox")
      .on(t.updatedAt, t.id)
      .where(sql`${t.paid} is not null and ${t.paidDispatchedAt} is null`),
  ],
);
