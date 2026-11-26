import * as pg from "drizzle-orm/pg-core";
import { fields } from "./fields";
export const moduleName = "sps_agent";
export const table = "work_attempt";
export const Table = pg.pgTable("sps_agent_work_attempt", fields, (t) => [
  pg
    .uniqueIndex("sps_agent_work_event_step")
    .on(t.storeId, t.taskId, t.eventId, t.capability, t.stepKey),
  pg.index("sps_agent_work_recovery").on(t.state, t.updatedAt),
  pg.index("sps_agent_work_owner_task").on(t.ownerId, t.storeId, t.taskId),
]);
