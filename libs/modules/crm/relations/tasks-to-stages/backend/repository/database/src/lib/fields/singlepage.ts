import * as pgCore from "drizzle-orm/pg-core";
import type {
  ITaskEventDetail,
  TTaskEventKind,
  TTaskStageState,
} from "@sps/crm/relations/tasks-to-stages/sdk/model/src/lib/workflow";
import type { TActorKind } from "@sps/crm/models/funnel/sdk/model/src/lib/workflow";

import { Table as Task } from "@sps/crm/models/task/backend/repository/database/src/lib/schema";
import { Table as Stage } from "@sps/crm/models/stage/backend/repository/database/src/lib/schema";
import type { TTaskStatus } from "@sps/crm/models/task/sdk/model/src/lib/workflow";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore
    .timestamp("created_at", { precision: 3 })
    .notNull()
    .defaultNow(),
  taskId: pgCore
    .uuid("task_id")
    .notNull()
    .references(() => Task.id, { onDelete: "restrict" }),
  stageId: pgCore
    .uuid("stage_id")
    .notNull()
    .references(() => Stage.id, { onDelete: "restrict" }),
  variant: pgCore
    .text("variant")
    .$type<TTaskStageState | "history">()
    .notNull()
    .default("history"),
  queuedAt: pgCore.timestamp("queued_at", { precision: 3 }),
  pending: pgCore.boolean("pending").notNull().default(false),
  status: pgCore.text("status").$type<TTaskStatus | "unknown">().notNull(),
  comment: pgCore.text("comment"),
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
