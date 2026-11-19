import * as pgCore from "drizzle-orm/pg-core";
import type {
  ITaskEventDetail,
  TTaskEventKind,
} from "@sps/crm/models/task-event/sdk/model/src/lib/workflow";
import type { TActorKind } from "@sps/crm/models/funnel/sdk/model/src/lib/workflow";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore
    .timestamp("created_at", { precision: 3 })
    .notNull()
    .defaultNow(),
  taskId: pgCore.uuid("task_id").notNull(),
  revision: pgCore.integer("revision").notNull(),
  assignmentRevision: pgCore.integer("assignment_revision").notNull(),
  kind: pgCore.text("kind").$type<TTaskEventKind>().notNull(),
  actorId: pgCore.uuid("actor_id"),
  actorKind: pgCore.text("actor_kind").$type<TActorKind>(),
  causeId: pgCore.text("cause_id"),
  operationKey: pgCore.text("operation_key").notNull(),
  operationDigest: pgCore.text("operation_digest").notNull(),
  detail: pgCore.jsonb("detail").$type<ITaskEventDetail>().notNull(),
};
