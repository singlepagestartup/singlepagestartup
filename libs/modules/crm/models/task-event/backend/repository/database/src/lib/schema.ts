import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_cm";
export const table = "task_event";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, fields, (t) => [
  pgCore.uniqueIndex("cm_task_event_revision").on(t.taskId, t.revision),
  pgCore.uniqueIndex("cm_task_event_operation").on(t.taskId, t.operationKey),
]);
