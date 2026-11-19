import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { createAppAssembly } from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService as createStore } from "@sps/ecommerce/models/store/backend/app/api/src/lib/bootstrap";
import { createServices } from "@sps/crm/backend/app/api/src/lib/services";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import type { ISaveFunnelDraft } from "@sps/crm/models/funnel/sdk/model";

const stores: string[] = [];
const discussion: ISaveFunnelDraft["definition"] = {
  initialStageId: "intake",
  stages: [
    {
      id: "intake",
      name: "Intake",
      actions: [
        {
          id: "wait",
          name: "Wait for reply",
          actors: ["manager"],
          evidence: ["manual"],
          nextStageId: "waiting",
        },
      ],
    },
    {
      id: "waiting",
      name: "Awaiting reply",
      waiting: {
        expectedEvent: "message",
        deadlineSeconds: 600,
        reminderSeconds: [60],
        completionEvidence: ["manual"],
      },
      actions: [
        {
          id: "reply",
          name: "Resolve on reply",
          actors: ["ai"],
          evidence: ["message"],
          outcome: "completed",
        },
      ],
    },
  ],
};

async function fixture(definition = discussion) {
  const assembly = createAppAssembly();
  const storeService = createStore(assembly);
  const store = await storeService.create({
    data: {
      slug: `crm-workflow-${randomUUID()}`,
      adminTitle: "Workflow fixture",
    },
  });
  stores.push(store.id);
  const scope = { storeId: store.id };
  const actorId = randomUUID();
  const customerId = randomUUID();
  const workflow = createServices(assembly);
  const draft = await workflow.funnel.saveDraft({
    ...scope,
    name: "Consultation",
    kind: "consultation",
    definition,
  });
  const publishInput = {
    ...scope,
    funnelId: draft.id,
    expectedRevision: draft.revision,
    actorId,
    operationKey: randomUUID(),
  };
  const publication = await workflow.funnel.publish(publishInput);
  const openInput = {
    ...scope,
    funnelId: draft.id,
    customerId,
    actorId,
    operationKey: randomUUID(),
  };
  const task = await workflow.task.open(openInput);
  return {
    workflow,
    scope,
    actorId,
    draft,
    publication,
    publishInput,
    openInput,
    task,
  };
}

afterEach(async () => {
  await getPostgresClient().begin(async (sql) => {
    for (const id of stores.splice(0)) {
      await sql`DELETE FROM sps_cm_tasks_to_events WHERE task_id IN (SELECT id FROM sps_cm_task WHERE store_id = ${id})`;
      await sql`DELETE FROM sps_cm_tasks_to_publications WHERE task_id IN (SELECT id FROM sps_cm_task WHERE store_id = ${id})`;
      await sql`DELETE FROM sps_cm_task_event WHERE task_id IN (SELECT id FROM sps_cm_task WHERE store_id = ${id})`;
      await sql`DELETE FROM sps_cm_task WHERE store_id = ${id}`;
      await sql`DELETE FROM sps_cm_funnels_to_publications WHERE funnel_id IN (SELECT id FROM sps_cm_funnel WHERE store_id = ${id})`;
      await sql`DELETE FROM sps_cm_funnel_publication WHERE funnel_id IN (SELECT id FROM sps_cm_funnel WHERE store_id = ${id})`;
      await sql`DELETE FROM sps_cm_funnels_to_stores WHERE store_id = ${id}`;
      await sql`DELETE FROM sps_cm_funnel WHERE store_id = ${id}`;
      await sql`DELETE FROM sps_ee_store WHERE id = ${id}`;
    }
  });
});

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

it("pins open tasks to their original publication until a manager explicitly migrates them", async () => {
  const {
    workflow,
    scope,
    actorId,
    draft,
    publication,
    publishInput,
    openInput,
    task,
  } = await fixture();
  expect(await workflow.funnel.publish(publishInput)).toEqual(publication);

  const revised = await workflow.funnel.saveDraft({
    ...scope,
    funnelId: draft.id,
    name: "Renamed consultation",
    kind: "consultation",
    expectedRevision: draft.revision,
    definition: { ...discussion, stages: [...discussion.stages].reverse() },
  });
  const next = await workflow.funnel.publish({
    ...publishInput,
    expectedRevision: revised.revision,
    operationKey: randomUUID(),
  });
  const taskScope = { ...scope, taskId: task.id };
  expect(await workflow.task.getPublication(taskScope)).toEqual(publication);
  expect(await workflow.task.open(openInput)).toMatchObject({ id: task.id });
  await expect(
    workflow.task.open({ ...openInput, customerId: randomUUID() }),
  ).rejects.toThrow("Opening key");
  const second = await workflow.task.open({
    ...openInput,
    operationKey: randomUUID(),
  });
  expect(second.publicationId).toBe(next.id);

  const page = await workflow.task.list({ ...scope, limit: 1 });
  expect(page.items).toHaveLength(1);
  expect(page.nextCursor).toBeTruthy();
  const remainder = await workflow.task.list({
    ...scope,
    limit: 1,
    cursor: page.nextCursor!,
  });
  expect(
    new Set([...page.items, ...remainder.items].map((row) => row.id)),
  ).toEqual(new Set([task.id, second.id]));

  const migrated = await workflow.task.migrate({
    ...taskScope,
    actorId,
    expectedRevision: task.revision,
    publicationId: next.id,
    stageId: "intake",
    reason: "Keep the initial step of the revised consultation",
    operationKey: randomUUID(),
  });
  expect(migrated.publicationId).toBe(next.id);
  const history = await workflow.task.history({ ...taskScope, limit: 1 });
  expect(history.items[0].detail).toMatchObject({
    previousPublicationId: publication.id,
    publicationId: next.id,
    reason: "Keep the initial step of the revised consultation",
  });
  const older = await workflow.task.history({
    ...taskScope,
    limit: 1,
    cursor: history.nextCursor!,
  });
  expect(older.items.map((event) => event.kind)).toEqual(["opened"]);
  await expect(
    workflow.task.get({ taskId: task.id, storeId: randomUUID() }),
  ).rejects.toThrow("does not exist in this store");
});

it("serializes revision races, cancels replaced timers, and applies a repeated notice once", async () => {
  const { workflow, scope, actorId, task } = await fixture();
  const taskScope = { ...scope, taskId: task.id };
  const move = {
    ...taskScope,
    actorId,
    actorKind: "manager" as const,
    expectedRevision: task.revision,
    operationKey: randomUUID(),
    actionId: "wait",
    evidence: {
      kind: "manual" as const,
      reason: "The customer needs time to reply",
    },
  };
  const competing = { ...move, operationKey: randomUUID() };
  const transitions = await Promise.allSettled([
    workflow.task.transition(move),
    workflow.task.transition(competing),
  ]);
  expect(transitions.map((result) => result.status).sort()).toEqual([
    "fulfilled",
    "rejected",
  ]);
  const waiting = await workflow.task.get(taskScope);
  const assigned = await workflow.task.assign({
    ...taskScope,
    actorId,
    assigneeId: randomUUID(),
    assigneeKind: "ai",
    expectedRevision: waiting.revision,
    operationKey: randomUUID(),
  });
  await expect(
    workflow.task.getWork({
      ...taskScope,
      assigneeId: assigned.assigneeId!,
      expectedAssignmentRevision: assigned.assignmentRevision,
    }),
  ).rejects.toThrow("not accepting work");
  await expect(
    workflow.task.transition({
      ...taskScope,
      actorId: assigned.assigneeId!,
      actorKind: "ai",
      actionId: "reply",
      expectedRevision: assigned.revision,
      expectedAssignmentRevision: assigned.assignmentRevision - 1,
      evidence: { kind: "message", messageId: randomUUID() },
      operationKey: randomUUID(),
    }),
  ).rejects.toThrow("assignment has changed");
  const stale = await workflow.task.applyTimer({
    ...taskScope,
    timerKey: waiting.timer!.key,
  });
  expect(stale).toMatchObject({ event: null, applied: false });

  const db = getDrizzle({});
  await db
    .update(Task)
    .set({ nextActionAt: new Date(0) })
    .where(eq(Task.id, task.id));
  expect((await workflow.task.listDue(scope)).map((row) => row.id)).toEqual([
    task.id,
  ]);
  const timerInput = { ...taskScope, timerKey: assigned.timer!.key };
  const attempts = await Promise.all([
    workflow.task.applyTimer(timerInput),
    workflow.task.applyTimer(timerInput),
  ]);
  expect(attempts.filter((result) => result.applied)).toHaveLength(1);
  expect(attempts[0].event?.id).toBe(attempts[1].event?.id);
  expect(attempts[0].event?.kind).toBe("reminder-due");

  const current = await workflow.task.get(taskScope);
  const withEvidence = await workflow.task.recordEvidence({
    ...taskScope,
    actorId,
    actorKind: "manager",
    expectedRevision: current.revision,
    evidence: {
      kind: "manual",
      reason: "The customer confirmed the answer by phone",
    },
    operationKey: randomUUID(),
  });
  await db
    .update(Task)
    .set({ deadlineAt: new Date(0), nextActionAt: new Date(0) })
    .where(eq(Task.id, task.id));
  const closed = await workflow.task.applyTimer({
    ...taskScope,
    timerKey: withEvidence.timer!.key,
  });
  expect(closed.task).toMatchObject({
    status: "closed",
    stageId: "waiting",
    outcome: "completed",
    timer: null,
  });
  expect(closed.event).toMatchObject({
    kind: "deadline-reached",
    causeId: expect.any(String),
  });
  const history = await workflow.task.history(taskScope);
  expect(history.items.map((event) => event.kind)).toEqual([
    "deadline-reached",
    "evidence-recorded",
    "reminder-due",
    "assigned",
    "transitioned",
    "opened",
  ]);
});
