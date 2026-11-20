import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_cm";
export const table = "task";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, fields, (t) => [
  pgCore.uniqueIndex("cm_task_opening").on(t.storeId, t.openingKey),
  pgCore
    .index("cm_task_store_updated")
    .on(t.storeId, t.updatedAt.desc(), t.id.desc()),
  pgCore
    .index("cm_task_store_funnel_updated")
    .on(t.storeId, t.funnelId, t.updatedAt.desc(), t.id.desc()),
  pgCore
    .index("cm_task_store_stage_updated")
    .on(t.storeId, t.stageId, t.updatedAt.desc(), t.id.desc()),
  pgCore
    .index("cm_task_store_funnel_stage_updated")
    .on(t.storeId, t.funnelId, t.stageId, t.updatedAt.desc(), t.id.desc()),
  pgCore
    .index("cm_task_store_customer_updated")
    .on(t.storeId, t.customerId, t.updatedAt.desc(), t.id.desc()),
  pgCore
    .uniqueIndex("cm_task_store_order")
    .on(t.storeId, t.orderId)
    .where(sql`${t.orderId} is not null`),
  pgCore
    .index("cm_task_store_due")
    .on(t.storeId, t.nextActionAt, t.id)
    .where(sql`${t.status} = 'waiting'`),
  pgCore
    .index("cm_task_due")
    .on(t.nextActionAt, t.id)
    .where(sql`${t.status} = 'waiting'`),
]);
