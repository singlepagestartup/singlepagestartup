import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_cm";
export const table = "tasks_to_stages";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, fields, (t) => [
  pgCore
    .uniqueIndex("cm_tasks_to_stages_revision")
    .on(t.taskId, t.revision)
    .where(sql`${t.variant} = 'history'`),
  pgCore
    .index("cm_tasks_to_stages_pending")
    .on(t.pending, t.taskId, t.assignmentRevision, t.revision),
  pgCore
    .uniqueIndex("cm_tasks_to_stages_operation")
    .on(t.taskId, t.operationKey)
    .where(sql`${t.variant} = 'history'`),
  pgCore
    .uniqueIndex("cm_tasks_to_stages_state")
    .on(t.taskId, t.stageId)
    .where(sql`${t.variant} <> 'history'`),
  pgCore
    .uniqueIndex("cm_tasks_to_stages_current")
    .on(t.taskId)
    .where(sql`${t.variant} = 'current'`),
]);
