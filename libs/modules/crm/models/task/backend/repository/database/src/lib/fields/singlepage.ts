import * as pgCore from "drizzle-orm/pg-core";
import type {
  TEvidenceKind,
  TTaskOutcome,
} from "@sps/crm/models/funnel/sdk/model/src/lib/workflow";
import type {
  ITaskTimer,
  TTaskAssigneeKind,
  TTaskStatus,
} from "@sps/crm/models/task/sdk/model/src/lib/workflow";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore
    .timestamp("created_at", { precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: pgCore
    .timestamp("updated_at", { precision: 3 })
    .notNull()
    .defaultNow(),
  stageId: pgCore.text("stage_id").notNull(),
  status: pgCore.text("status").$type<TTaskStatus>().notNull(),
  expectedEvent: pgCore.text("expected_event").$type<TEvidenceKind>(),
  outcome: pgCore.text("outcome").$type<TTaskOutcome>(),
  revision: pgCore.integer("revision").notNull().default(1),
  assigneeKind: pgCore.text("assignee_kind").$type<TTaskAssigneeKind>(),
  assignmentRevision: pgCore
    .integer("assignment_revision")
    .notNull()
    .default(0),
  assignmentExpiresAt: pgCore.timestamp("assignment_expires_at", {
    precision: 3,
  }),
  waitingRevision: pgCore.integer("waiting_revision"),
  waitingSince: pgCore.timestamp("waiting_since", { precision: 3 }),
  deadlineAt: pgCore.timestamp("deadline_at", { precision: 3 }),
  nextActionAt: pgCore.timestamp("next_action_at", { precision: 3 }),
  timer: pgCore.jsonb("timer").$type<ITaskTimer>(),
  openingKey: pgCore.text("opening_key").notNull(),
  openingDigest: pgCore.text("opening_digest").notNull(),
};
