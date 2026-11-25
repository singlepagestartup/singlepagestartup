import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_cm";
export const table = "task";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, fields, (t) => [
  pgCore.index("cm_task_opening_key").on(t.openingKey),
  pgCore.index("cm_task_updated").on(t.updatedAt.desc(), t.id.desc()),
  pgCore
    .index("cm_task_stage_updated")
    .on(t.stageId, t.updatedAt.desc(), t.id.desc()),
  pgCore
    .index("cm_task_due")
    .on(t.nextActionAt, t.id)
    .where(sql`${t.status} = 'waiting'`),
]);
