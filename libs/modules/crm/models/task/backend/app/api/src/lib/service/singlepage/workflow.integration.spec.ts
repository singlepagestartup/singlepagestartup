import { randomUUID } from "node:crypto";
import { v5 as stageUuid } from "uuid";
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
import { type ISaveFunnel } from "@sps/crm/models/funnel/sdk/model";

const stores: string[] = [];
const originalStages = new Map<string, string[]>();
const discussion: ISaveFunnel["definition"] = {
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

async function fixture(
  definition = discussion,
  kind: ISaveFunnel["kind"] = "consultation",
) {
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
  const participants = new Map<
    string,
    { customerId: string; assigneeId: string | null }
  >();
  workflow.task.configureParticipants({
    async getForTasks(ids) {
      return new Map(
        ids.flatMap((id) =>
          participants.has(id) ? [[id, participants.get(id)!] as const] : [],
        ),
      );
    },
    async listTaskIds(filter) {
      return [...participants]
        .filter(
          ([, entry]) =>
            (!filter.customerId || filter.customerId === entry.customerId) &&
            (!filter.assigneeId || filter.assigneeId === entry.assigneeId),
        )
        .map(([id]) => id);
    },
    async setCustomer(id, customerId) {
      participants.set(id, {
        customerId,
        assigneeId: participants.get(id)?.assigneeId ?? null,
      });
    },
    async setAssignee(id, assigneeId) {
      participants.set(id, { ...participants.get(id)!, assigneeId });
    },
  });
  const saveInput = {
    ...scope,
    name: "Consultation",
    kind,
    operationKey: randomUUID(),
    definition,
  };
  const funnel = await workflow.funnel.save(saveInput);
  originalStages.set(
    store.id,
    funnel.definition.stages.map((stage) => stageUuid(stage.id, funnel.id)),
  );
  const openInput = {
    ...scope,
    funnelId: funnel.id,
    customerId,
    actorId,
    operationKey: randomUUID(),
  };
  const task = await workflow.task.open(openInput);
  return {
    workflow,
    scope,
    actorId,
    funnel,
    saveInput,
    openInput,
    task,
  };
}

afterEach(async () => {
  await getPostgresClient().begin(async (sql) => {
    for (const id of stores.splice(0)) {
      const funnels =
        await sql`select id from sps_cm_funnel where store_id=${id}`;
      const funnelIds = funnels.map((row) => row.id);
      const tasks =
        await sql`select task_id from sps_cm_funnels_to_tasks where funnel_id=any(${funnelIds}::uuid[])`;
      const taskIds = tasks.map((row) => row.task_id);
      const stages =
        await sql`delete from sps_cm_funnels_to_stages where funnel_id=any(${funnelIds}::uuid[]) returning stage_id`;
      await sql`delete from sps_cm_tasks_to_stages where task_id=any(${taskIds}::uuid[])`;
      await sql`delete from sps_cm_funnels_to_tasks where funnel_id=any(${funnelIds}::uuid[])`;
      await sql`delete from sps_cm_tasks_to_offers where task_id=any(${taskIds}::uuid[])`;
      await sql`delete from sps_cm_tasks_to_orders where task_id=any(${taskIds}::uuid[])`;
      await sql`delete from sps_cm_task where id=any(${taskIds}::uuid[])`;
      const stageIds = [
        ...stages.map((row) => row.stage_id),
        ...(originalStages.get(id) ?? []),
      ];
      await sql`delete from sps_cm_stage where id=any(${stageIds}::uuid[])`;
      originalStages.delete(id);
      await sql`delete from sps_cm_funnels_to_offers where funnel_id=any(${funnelIds}::uuid[])`;
      await sql`delete from sps_cm_funnel where id=any(${funnelIds}::uuid[])`;
      await sql`DELETE FROM sps_ee_store WHERE id = ${id}`;
    }
  });
});

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

it("uses one saved configuration for existing and new tasks", async () => {
  const { workflow, scope, funnel, saveInput, openInput, task } =
    await fixture();
  expect(await workflow.funnel.save(saveInput)).toEqual(funnel);

  const update = {
    ...scope,
    funnelId: funnel.id,
    name: "Renamed consultation",
    kind: "consultation" as const,
    expectedRevision: funnel.revision,
    definition: { ...discussion, stages: [...discussion.stages].reverse() },
  };
  const revised = await workflow.funnel.save(update);
  expect(revised.slug).toBe(funnel.slug);
  expect(
    await workflow.funnel.getBySlug({ ...scope, funnelSlug: funnel.slug }),
  ).toEqual(revised);
  expect(await workflow.funnel.save(update)).toEqual(revised);
  await expect(
    workflow.funnel.save({ ...update, name: "Conflicting edit" }),
  ).rejects.toThrow("Reload the funnel");
  const taskScope = { ...scope, taskId: task.id };
  expect(await workflow.task.getFunnel(taskScope)).toMatchObject(revised);
  expect(
    await workflow.task.open({
      ...openInput,
      expectedFunnelRevision: revised.revision,
    }),
  ).toMatchObject({ id: task.id });
  await expect(
    workflow.task.open({ ...openInput, customerId: randomUUID() }),
  ).rejects.toThrow("Opening key");
  const second = await workflow.task.open({
    ...openInput,
    expectedFunnelRevision: revised.revision,
    operationKey: randomUUID(),
  });
  expect(second.funnelId).toBe(funnel.id);
  expect(
    await workflow.task.getFunnel({ ...scope, taskId: second.id }),
  ).toMatchObject(revised);
  const linked = await workflow.funnelsToTasks.find({
    params: {
      filters: {
        and: [{ column: "funnelId", method: "eq", value: funnel.id }],
      },
    },
  });
  expect(new Set(linked.map((row) => row.taskId))).toEqual(
    new Set([task.id, second.id]),
  );

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

  const history = await workflow.task.history(taskScope);
  expect(history.items.map((event) => event.kind)).toEqual(["opened"]);
  await expect(
    workflow.task.get({ taskId: task.id, storeId: randomUUID() }),
  ).rejects.toThrow("does not exist in this store");
});

it("keeps relation IDs, entry points and open tasks consistent when linear stages are moved or unlinked", async () => {
  const stage = (id: string) => ({ id, name: id, actions: [] });
  const [intake, design, review, extra] = [
    "intake",
    "design",
    "review",
    "extra",
  ].map(stage);
  const { workflow, scope, actorId, funnel, task, openInput } = await fixture({
    progression: "linear",
    initialStageId: intake.id,
    stages: [intake, design, review, extra],
  });
  const taskScope = { ...scope, taskId: task.id };
  await workflow.task.transition({
    ...taskScope,
    actorId,
    actorKind: "manager",
    expectedRevision: task.revision,
    actionId: "advance-manually",
    operationKey: randomUUID(),
    evidence: { kind: "manual", reason: "Intake complete" },
  });
  const readLinks = () =>
    workflow.funnelsToStages.find({
      params: {
        filters: {
          and: [{ column: "funnelId", method: "eq", value: funnel.id }],
        },
      },
    });
  const before = await readLinks();
  const edit = {
    ...scope,
    funnelId: funnel.id,
    name: funnel.name,
    kind: funnel.kind,
    expectedRevision: funnel.revision,
    definition: { ...funnel.definition, stages: [review, intake, design] },
  };
  const saved = await workflow.funnel.save(edit);
  expect(await workflow.funnel.save(edit)).toEqual(saved);
  expect(
    await workflow.funnel.getBySlug({ ...scope, funnelSlug: funnel.slug }),
  ).toEqual(saved);
  expect(saved.definition.initialStageId).toBe(review.id);
  expect(saved.definition.stages.map(({ id }) => id)).toEqual([
    "review",
    "intake",
    "design",
  ]);
  const after = (await readLinks()).sort((a, b) => a.position - b.position);
  expect(after.map(({ id }) => id)).toEqual(
    [review, intake, design].map(
      (s) =>
        before.find((row) => row.stageId === stageUuid(s.id, funnel.id))!.id,
    ),
  );
  expect(await workflow.task.get(taskScope)).toMatchObject({
    stageId: review.id,
  });
  expect(await workflow.tasksToStages.stageStates(task.id)).toMatchObject({
    intake: "completed",
    design: "required",
    review: "current",
  });
  expect(
    (await workflow.task.getFunnel(taskScope)).definition.stages.map(
      ({ id }) => id,
    ),
  ).toEqual(["review", "intake", "design"]);
  const fresh = await workflow.task.open({
    ...openInput,
    operationKey: randomUUID(),
  });
  expect(fresh.stageId).toBe(review.id);
  expect(await workflow.tasksToStages.stageStates(fresh.id)).toEqual({
    review: "current",
    intake: "pending",
    design: "pending",
  });
  await expect(
    workflow.funnel.save({
      ...edit,
      expectedRevision: saved.revision,
      definition: { ...saved.definition, stages: [intake, design] },
    }),
  ).rejects.toThrow('open tasks in "review"');
  expect(await workflow.funnel.get(scope.storeId, funnel.id)).toEqual(saved);
  await workflow.funnelsToStages.update({
    id: after[2].id,
    data: { position: -1 },
  });
  const reordered = await workflow.funnel.get(scope.storeId, funnel.id);
  expect(reordered.definition.initialStageId).toBe(design.id);
  expect(reordered.definition.stages[0].actions[0].nextStageId).toBe(review.id);
  expect(await workflow.task.get(taskScope)).toMatchObject({
    stageId: design.id,
  });
});

it("continues an open task on its original stage ID when a saved delivery graph becomes editable agent work", async () => {
  const employee = randomUUID();
  const currencyId = randomUUID();
  const { workflow, scope, task, funnel, actorId } = await fixture(
    {
      initialStageId: "deliver",
      stages: [
        {
          id: "deliver",
          name: "Выдача",
          behavior: "order-file-delivery",
          defaultAssigneeSubjectId: employee,
          workFunding: {
            payer: "customer",
            multiplier: "0",
            currencyId,
            maxStageAmount: "0",
            maxRunAmount: "0",
          },
          actions: [
            {
              id: "legacy",
              name: "Original released",
              actors: ["system"],
              evidence: ["delivery"],
              deliveryStage: "delivered",
              nextStageId: "follow-up",
            },
          ],
        },
        {
          id: "follow-up",
          name: "Обратная связь",
          actions: [
            {
              id: "close",
              name: "Завершить",
              actors: ["manager"],
              evidence: ["manual"],
              outcome: "completed",
            },
          ],
        },
      ],
    },
    "individual-service",
  );
  expect(task.stageId).toBe("deliver");
  const taskScope = { ...scope, taskId: task.id };
  const saved = await workflow.funnel.edit(
    {
      kind: "save-funnel-stage",
      funnel: {
        ...scope,
        funnelId: funnel.id,
        expectedRevision: funnel.revision,
        stage: { ...funnel.definition.stages[1], name: "Отзыв" },
      },
    },
    actorId,
  );
  const runtime = await workflow.task.getFunnel(taskScope);
  expect(runtime.definition).toEqual(saved.definition);
  expect(runtime.definition.stages.map((stage) => stage.id)).toEqual([
    "deliver",
    "follow-up",
  ]);
  const [delivery] = runtime.definition.stages;
  expect(delivery.behavior).toBeUndefined();
  expect(delivery.evidenceInstruction).toContain("прикреплён");
  const current = await workflow.task.get(taskScope);
  expect(current.stageId).toBe(task.stageId);
  const assigned = await workflow.task.assign({
    ...taskScope,
    actorId,
    assigneeId: employee,
    assigneeKind: "ai",
    expectedRevision: current.revision,
    operationKey: randomUUID(),
  });
  const event = await workflow.task.queueStageCheck(
    assigned,
    employee,
    randomUUID(),
  );
  expect(event?.id).toBeDefined();
  const latest = await workflow.task.get(taskScope);
  const transition = {
    ...taskScope,
    actorId: employee,
    actorKind: "ai" as const,
    expectedAssignmentRevision: assigned.assignmentRevision,
    expectedRevision: latest.revision,
    actionId: "advance",
    causeId: event!.id,
    operationKey: `stage-complete:${event!.id}`,
    evidence: { kind: "model-result" as const, resultId: randomUUID() },
  };
  const completed = await workflow.task.transition(transition);
  expect(completed).toMatchObject({ stageId: "follow-up", status: "active" });
  expect((await workflow.task.transition(transition)).revision).toBe(
    completed.revision,
  );
  expect(await workflow.tasksToStages.stageStates(task.id)).toEqual({
    deliver: "completed",
    "follow-up": "current",
  });
});

it("edits funnel parts independently and moves unfinished work without recording payment or delivery", async () => {
  const { workflow, scope, actorId, task, funnel, openInput } = await fixture({
    progression: "linear",
    initialStageId: "brief",
    goal: "Original goal",
    stages: [
      { id: "brief", name: "Brief", actions: [] },
      {
        id: "payment",
        name: "Payment",
        behavior: "ecommerce-module-order-payment",
        actions: [],
      },
      {
        id: "delivery",
        name: "Delivery",
        behavior: "order-file-delivery",
        actions: [],
      },
    ],
  });
  const base = {
    ...scope,
    funnelId: funnel.id,
    expectedRevision: funnel.revision,
  };
  const readStorage = async () =>
    getPostgresClient()`select f.id, f.position, f.xmin::text as link_write, s.key, s.xmin::text as stage_write from sps_cm_funnels_to_stages f join sps_cm_stage s on s.id=f.stage_id where f.funnel_id=${funnel.id} order by f.position`;
  const original = await readStorage();
  const settings = await workflow.funnel.edit(
    {
      kind: "save-funnel-settings",
      funnel: { ...base, name: "New name", goal: "New goal" },
    },
    actorId,
  );
  expect(await readStorage()).toEqual(original);
  const patch = {
    kind: "save-funnel-stage" as const,
    funnel: {
      ...base,
      expectedRevision: settings.revision,
      stage: { ...settings.definition.stages[0], name: "Revised brief" },
    },
  };
  const edited = await workflow.funnel.edit(patch, actorId);
  expect(edited).toMatchObject({
    name: "New name",
    definition: { goal: "New goal" },
  });
  const changed = await readStorage();
  expect(changed.slice(1)).toEqual(original.slice(1));
  expect(changed[0].link_write).toBe(original[0].link_write);
  expect(changed[0].stage_write).not.toBe(original[0].stage_write);
  await expect(
    workflow.funnel.edit(
      {
        ...patch,
        funnel: {
          ...patch.funnel,
          stage: { ...patch.funnel.stage, name: "Stale" },
        },
      },
      actorId,
    ),
  ).rejects.toThrow("Reload");
  await expect(
    workflow.funnel.edit(
      {
        kind: "move-funnel-stage",
        funnel: {
          ...base,
          storeId: randomUUID(),
          expectedRevision: edited.revision,
          stageId: "payment",
          targetStageId: "brief",
        },
      },
      actorId,
    ),
  ).rejects.toThrow("in this store");
  const revision = { ...base, expectedRevision: edited.revision };
  const deletion = {
    kind: "delete-funnel-stage" as const,
    funnel: { ...revision, stageId: "brief" },
  };
  await expect(workflow.funnel.edit(deletion, actorId)).rejects.toThrow(
    "open tasks",
  );
  await expect(
    workflow.funnel.edit(
      { ...deletion, funnel: { ...deletion.funnel, targetStageId: "brief" } },
      actorId,
    ),
  ).rejects.toThrow("different stage");
  expect((await workflow.funnel.get(scope.storeId, funnel.id)).revision).toBe(
    edited.revision,
  );
  const closed = await workflow.task.open({
    ...openInput,
    operationKey: randomUUID(),
  });
  await workflow.task.close({
    ...scope,
    taskId: closed.id,
    actorId,
    expectedRevision: closed.revision,
    operationKey: randomUUID(),
    reason: "Cancelled",
  });
  const before = await workflow.task.get({ ...scope, taskId: task.id });
  await expect(
    workflow.funnel.edit(
      {
        ...deletion,
        funnel: { ...deletion.funnel, targetStageId: "delivery" },
      },
      actorId,
      {
        async onMigrated() {
          throw new Error("Employee unavailable");
        },
      },
    ),
  ).rejects.toThrow("Employee unavailable");
  expect(await workflow.task.get({ ...scope, taskId: task.id })).toEqual(
    before,
  );
  expect((await workflow.funnel.get(scope.storeId, funnel.id)).revision).toBe(
    edited.revision,
  );
  const removed = await workflow.funnel.edit(
    { ...deletion, funnel: { ...deletion.funnel, targetStageId: "delivery" } },
    actorId,
  );
  const moved = await workflow.task.get({ ...scope, taskId: task.id });
  expect(moved).toMatchObject({
    stageId: "delivery",
    revision: before.revision + 1,
    assignmentRevision: before.assignmentRevision + 1,
  });
  expect(await workflow.tasksToStages.stageStates(task.id)).toEqual({
    brief: "closed",
    payment: "pending",
    delivery: "current",
  });
  expect(await workflow.tasksToStages.stageStates(closed.id)).toEqual({
    brief: "closed",
    payment: "pending",
    delivery: "pending",
  });
  const history = await workflow.task.history({ ...scope, taskId: task.id });
  expect(history.items[0]).toMatchObject({
    kind: "migrated",
    actorId,
    detail: { previousStageId: "brief", stageId: "delivery" },
  });
  expect(history.items[0].detail.evidence).toBeUndefined();
  await expect(
    workflow.funnel.edit(
      {
        kind: "delete-funnel-stage",
        funnel: {
          ...base,
          expectedRevision: removed.revision,
          stageId: "payment",
          targetStageId: "missing",
        },
      },
      actorId,
    ),
  ).rejects.toThrow("does not belong to this funnel");
  const added = await workflow.funnel.edit(
    {
      kind: "save-funnel-stage",
      funnel: {
        ...base,
        expectedRevision: removed.revision,
        stage: { id: "follow-up", name: "Follow-up", actions: [] },
      },
    },
    actorId,
  );
  expect(added.definition.stages.map(({ id }) => id)).toEqual([
    "payment",
    "delivery",
    "follow-up",
  ]);
  const reordered = await workflow.funnel.edit(
    {
      kind: "move-funnel-stage",
      funnel: {
        ...base,
        expectedRevision: added.revision,
        stageId: "follow-up",
        targetStageId: "delivery",
      },
    },
    actorId,
  );
  expect(
    (await workflow.funnel.getBySlug({ ...scope, funnelSlug: funnel.slug }))
      .definition,
  ).toEqual(reordered.definition);
  expect(reordered.definition.stages.map(({ id }) => id)).toEqual([
    "payment",
    "follow-up",
    "delivery",
  ]);
  const concurrentScope = { ...base, expectedRevision: reordered.revision };
  const raced = await Promise.allSettled([
    workflow.funnel.edit(
      {
        kind: "save-funnel-settings",
        funnel: { ...concurrentScope, name: "Concurrent name" },
      },
      actorId,
    ),
    workflow.funnel.edit(
      {
        kind: "save-funnel-stage",
        funnel: {
          ...concurrentScope,
          stage: { id: "follow-up", name: "Concurrent stage", actions: [] },
        },
      },
      actorId,
    ),
  ]);
  expect(raced.filter((entry) => entry.status === "fulfilled")).toHaveLength(1);
  expect(raced.filter((entry) => entry.status === "rejected")).toHaveLength(1);
  expect((await workflow.funnel.get(scope.storeId, funnel.id)).revision).toBe(
    reordered.revision + 1,
  );
});

it("reopens a previously completed target and removes an unoccupied stage without a transfer", async () => {
  const { workflow, scope, actorId, task, funnel } = await fixture({
    progression: "linear",
    initialStageId: "brief",
    stages: ["brief", "work", "optional"].map((id) => ({
      id,
      name: id,
      actions: [],
    })),
  });
  const taskScope = { ...scope, taskId: task.id };
  const advanced = await workflow.task.transition({
    ...taskScope,
    actorId,
    actorKind: "manager",
    expectedRevision: task.revision,
    operationKey: randomUUID(),
    actionId: "advance-manually",
    evidence: { kind: "manual", reason: "Approved brief" },
  });
  const edit = {
    ...scope,
    funnelId: funnel.id,
    expectedRevision: funnel.revision,
  };
  const moved = await workflow.funnel.edit(
    {
      kind: "delete-funnel-stage",
      funnel: { ...edit, stageId: "work", targetStageId: "brief" },
    },
    actorId,
  );
  expect(await workflow.tasksToStages.stageStates(task.id)).toEqual({
    brief: "current",
    work: "closed",
    optional: "pending",
  });
  const history = await workflow.task.history(taskScope);
  expect(history.items.map(({ kind }) => kind)).toEqual([
    "migrated",
    "transitioned",
    "opened",
  ]);
  expect(history.items[1].detail.evidence).toMatchObject({
    kind: "manual",
    reason: "Approved brief",
  });
  await expect(
    workflow.task.transition({
      ...taskScope,
      actorId,
      actorKind: "manager",
      expectedRevision: advanced.revision,
      actionId: "advance-manually",
      operationKey: randomUUID(),
      evidence: { kind: "manual", reason: "stale" },
    }),
  ).rejects.toThrow("Reload");
  const cleaned = await workflow.funnel.edit(
    {
      kind: "delete-funnel-stage",
      funnel: {
        ...edit,
        expectedRevision: moved.revision,
        stageId: "optional",
      },
    },
    actorId,
  );
  expect(cleaned.definition.stages.map(({ id }) => id)).toEqual(["brief"]);
});

it("shares tasks among same-store funnels and executes only their primary funnel", async () => {
  const { workflow, scope, actorId, funnel, task, openInput, saveInput } =
    await fixture();
  const other = await fixture();
  const related = await workflow.funnel.save({
    ...saveInput,
    name: "Related",
    operationKey: randomUUID(),
  });
  originalStages.set(scope.storeId, [
    ...(originalStages.get(scope.storeId) ?? []),
    ...related.definition.stages.map((stage) =>
      stageUuid(stage.id, related.id),
    ),
  ]);
  const second = await workflow.task.open({
    ...openInput,
    operationKey: randomUUID(),
  });
  const taskScope = { ...scope, taskId: task.id };
  const attach = { ...taskScope, funnelId: related.id };
  const [link, replay] = await Promise.all([
    workflow.task.attachFunnel(attach),
    workflow.task.attachFunnel(attach),
  ]);
  expect(link).toMatchObject({
    taskId: task.id,
    funnelId: related.id,
    variant: "related",
  });
  expect(replay.id).toBe(link.id);
  await workflow.task.attachFunnel({ ...attach, taskId: second.id });
  for (const filter of [
    {},
    { funnelId: funnel.id },
    { funnelId: related.id },
  ]) {
    const page = await workflow.task.list({ ...scope, ...filter });
    expect(page.items).toHaveLength(2);
    expect(new Set(page.items.map((row) => row.id))).toEqual(
      new Set([task.id, second.id]),
    );
    expect(page.items.every((row) => row.funnelId === funnel.id)).toBe(true);
  }
  const membership = {
    params: {
      filters: {
        and: [
          {
            column: "funnelId",
            method: "inArray" as const,
            value: [related.id, funnel.id],
          },
        ],
      },
    },
  };
  expect(await workflow.task.count(membership)).toBe(2);
  expect(await workflow.task.find(membership)).toHaveLength(2);
  await expect(
    workflow.task.attachFunnel({ ...taskScope, funnelId: other.funnel.id }),
  ).rejects.toThrow("same store");
  await expect(
    workflow.task.attachFunnel({ ...attach, storeId: other.scope.storeId }),
  ).rejects.toThrow("does not exist in this store");
  const primary = await workflow.task.attachFunnel({
    ...taskScope,
    funnelId: funnel.id,
  });
  await expect(
    workflow.funnelsToTasks.delete({ id: primary.id }),
  ).rejects.toThrow("executing funnel");
  const waiting = await workflow.task.transition({
    ...taskScope,
    actorId,
    actorKind: "manager",
    actionId: "wait",
    expectedRevision: task.revision,
    operationKey: randomUUID(),
    evidence: { kind: "manual", reason: "awaiting reply" },
  });
  await workflow.funnel.save({
    ...scope,
    funnelId: related.id,
    name: related.name,
    kind: related.kind,
    expectedRevision: related.revision,
    definition: {
      initialStageId: "new",
      stages: [{ id: "new", name: "New", actions: [] }],
    },
  });
  expect(await workflow.task.get(taskScope)).toMatchObject({
    funnelId: funnel.id,
    stageId: "waiting",
    revision: waiting.revision,
    timer: waiting.timer,
  });
  await getDrizzle()
    .update(Task)
    .set({ nextActionAt: new Date(Date.now() - 1000) })
    .where(eq(Task.id, task.id));
  expect((await workflow.task.listDue(scope)).map((row) => row.id)).toEqual([
    task.id,
  ]);
  expect(
    await workflow.task.applyTimer({
      ...taskScope,
      timerKey: waiting.timer!.key,
    }),
  ).toMatchObject({ applied: true });
  await workflow.funnelsToTasks.delete({ id: link.id });
  expect(
    (await workflow.task.list({ ...scope, funnelId: related.id })).items.map(
      (row) => row.id,
    ),
  ).toEqual([second.id]);
});

it("assigns distinct slugs for simultaneous creates and reserves the new route", async () => {
  const { workflow, scope, saveInput } = await fixture();
  const name = "Новая воронка";
  const created = await Promise.all([
    workflow.funnel.save({ ...saveInput, name, operationKey: randomUUID() }),
    workflow.funnel.save({ ...saveInput, name, operationKey: randomUUID() }),
  ]);
  expect(new Set(created.map((funnel) => funnel.slug))).toEqual(
    new Set(["novaya-voronka", "novaya-voronka-2"]),
  );

  const reservedName = await workflow.funnel.save({
    ...saveInput,
    name: "new",
    operationKey: randomUUID(),
  });
  expect(reservedName.slug).toBe("new-funnel");
  await expect(
    workflow.funnel.getBySlug({ ...scope, funnelSlug: "new" }),
  ).rejects.toThrow();
  await expect(
    workflow.funnel.getBySlug({
      storeId: randomUUID(),
      funnelSlug: reservedName.slug,
    }),
  ).rejects.toThrow("Funnel does not exist in this store");
});

it("keeps occupied stages and updates the rules for waiting tasks", async () => {
  const { actorId, workflow, scope, funnel, task } = await fixture();
  const taskScope = { ...scope, taskId: task.id };
  const waiting = await workflow.task.transition({
    ...taskScope,
    actorId,
    actorKind: "manager",
    expectedRevision: task.revision,
    operationKey: randomUUID(),
    actionId: "wait",
    evidence: { kind: "manual", reason: "Waiting for the customer's reply" },
  });
  const edit = {
    ...scope,
    funnelId: funnel.id,
    kind: funnel.kind,
    name: funnel.name,
    expectedRevision: funnel.revision,
  };
  const [intake, waitingStage] = discussion.stages;
  await expect(
    workflow.funnel.save({
      ...edit,
      definition: { ...discussion, stages: [{ ...intake, actions: [] }] },
    }),
  ).rejects.toThrow("Awaiting reply");

  const withoutWaiting = {
    ...edit,
    definition: {
      ...discussion,
      stages: [intake, { ...waitingStage, waiting: undefined }],
    },
  };
  const updated = await workflow.funnel.save(withoutWaiting);
  expect(await workflow.funnel.save(withoutWaiting)).toEqual(updated);
  expect(await workflow.task.get(taskScope)).toMatchObject({
    stageId: "waiting",
    status: "active",
    timer: null,
  });
  expect(
    await workflow.task.applyTimer({
      ...taskScope,
      timerKey: waiting.timer!.key,
    }),
  ).toMatchObject({ event: null, applied: false });
});

it("keeps stage history after removing a closed task's stage", async () => {
  const { workflow, scope, task, funnel, saveInput, actorId } = await fixture();
  const taskScope = { ...scope, taskId: task.id };
  await workflow.task.close({
    ...taskScope,
    expectedRevision: task.revision,
    actorId,
    operationKey: randomUUID(),
    reason: "Customer ended the consultation",
  });
  await workflow.funnel.save({
    ...saveInput,
    funnelId: funnel.id,
    expectedRevision: funnel.revision,
    definition: {
      initialStageId: "next",
      stages: [{ id: "next", name: "Next", actions: [] }],
    },
  });
  const history = await workflow.task.history(taskScope);
  expect(history.items.map((entry) => [entry.status, entry.comment])).toEqual([
    ["closed", "Customer ended the consultation"],
    ["active", null],
  ]);
  expect(
    (await workflow.task.getFunnel(taskScope)).definition.stages.map(
      (s) => s.id,
    ),
  ).toEqual(["next", "intake", "waiting"]);
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
    outcome: "closed-without-result",
    timer: null,
  });
  expect(closed.event).toMatchObject({
    kind: "deadline-reached",
    causeId: null,
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

it("links multiple orders and offers and finds each task through either association", async () => {
  const { workflow, scope, actorId, task, openInput } = await fixture();
  const sql = getPostgresClient();
  const suffix = randomUUID();
  const [product] =
    await sql`insert into sps_ee_product(slug,admin_title) values(${suffix},'CRM offer fixture') returning id`;
  const offers = await sql`insert into sps_ee_ss_to_ps_vn7(se_id,pt_id,sku)
    values(${scope.storeId},${product.id},${suffix + "-1"}),(${scope.storeId},${product.id},${suffix + "-2"}) returning id`;
  const orders =
    await sql`insert into sps_ee_order(type) values('history'),('history') returning id`;
  try {
    for (const order of orders) {
      await sql`insert into sps_ee_ss_to_os_v03(se_id,or_id) values(${scope.storeId},${order.id})`;
      await sql`insert into sps_ee_os_to_ps_d4c(or_id,pt_id,offer_id) values(${order.id},${product.id},${offers[1].id})`;
    }
    let current = task;
    for (const offer of offers) {
      current = await workflow.task.attachOffer({
        ...scope,
        taskId: task.id,
        actorId,
        operationKey: randomUUID(),
        expectedRevision: current.revision,
        offerId: offer.id,
      });
    }
    for (const order of orders) {
      current = await workflow.task.attachOrder({
        ...scope,
        taskId: task.id,
        actorId,
        operationKey: randomUUID(),
        expectedRevision: current.revision,
        orderId: order.id,
      });
    }
    const other = await workflow.task.open({
      ...openInput,
      operationKey: randomUUID(),
      offerId: offers[1].id,
      orderId: orders[1].id,
    });
    expect(new Set(current.offerIds)).toEqual(new Set(offers.map((o) => o.id)));
    expect(new Set(current.orderIds)).toEqual(new Set(orders.map((o) => o.id)));
    const page = await workflow.task.list({ ...scope, orderId: orders[1].id });
    expect(new Set(page.items.map((row) => row.id))).toEqual(
      new Set([task.id, other.id]),
    );
    const matches = await workflow.task.find({
      params: {
        filters: {
          and: [{ column: "offerId", method: "eq", value: offers[1].id }],
        },
      },
    });
    expect(new Set(matches.map((row) => row.id))).toEqual(
      new Set([task.id, other.id]),
    );
  } finally {
    await sql`delete from sps_ee_order where id=any(${orders.map((o) => o.id)}::uuid[])`;
    await sql`delete from sps_ee_product where id=${product.id}`;
  }
});

it("does not reopen acknowledged work when deferral or enqueue is retried", async () => {
  const { workflow, scope, task, openInput } = await fixture();
  const messageId = randomUUID();
  const { event } = await workflow.task.activity({
    ...scope,
    taskId: task.id,
    actorId: openInput.customerId,
    operationKey: randomUUID(),
    expectedRevision: task.revision,
    kind: "customer-message",
    messageId,
  });
  const history = workflow.tasksToStages;
  await history.setPending(event.id, true);
  expect(await history.pendingHeads(2, task.id)).toEqual([{ id: event.id }]);
  await history.setPending(event.id, false);
  await history.defer(event.id);
  await history.setPending(event.id, true);
  expect(await history.pendingHeads(2, task.id)).toEqual([]);
  expect((await history.forMessages(task.id, [messageId]))[0]).toMatchObject({
    id: event.id,
    pending: false,
  });
});

it("links every stage once, resumes earlier inserted work, and freezes completed tasks", async () => {
  const { workflow, scope, actorId, task, funnel, saveInput, openInput } =
    await fixture();
  const states = (id: string) => workflow.tasksToStages.stageStates(id);
  expect(await states(task.id)).toEqual({
    intake: "current",
    waiting: "pending",
  });
  const closed = await workflow.task.open({
    ...openInput,
    operationKey: randomUUID(),
  });
  await workflow.task.close({
    ...scope,
    taskId: closed.id,
    actorId,
    expectedRevision: closed.revision,
    operationKey: randomUUID(),
    reason: "Cancelled",
  });
  const step = (revision: number, actionId: string) => ({
    ...scope,
    taskId: task.id,
    actorId,
    actorKind: "manager" as const,
    expectedRevision: revision,
    operationKey: randomUUID(),
    actionId,
    evidence: { kind: "manual" as const, reason: "Verified" },
  });
  const first = step(task.revision, "wait");
  const [waiting, replay] = await Promise.all([
    workflow.task.transition(first),
    workflow.task.transition(first),
  ]);
  expect(waiting.revision).toBe(replay.revision);
  expect(await states(task.id)).toEqual({
    intake: "completed",
    waiting: "current",
  });
  const intermediate = {
    id: "materials",
    name: "Materials",
    instruction: "Collect material specifications",
    actions: [
      {
        id: "review",
        name: "Review",
        actors: ["manager" as const],
        evidence: ["manual" as const],
        nextStageId: "intake",
      },
    ],
  };
  const changes = {
    ...saveInput,
    funnelId: funnel.id,
    expectedRevision: funnel.revision,
    definition: {
      ...discussion,
      stages: [discussion.stages[0], intermediate, discussion.stages[1]],
    },
  };
  await Promise.all([
    workflow.funnel.save(changes),
    workflow.funnel.save(changes),
  ]);
  expect(await states(task.id)).toEqual({
    intake: "completed",
    materials: "current",
    waiting: "required",
  });
  expect(await states(closed.id)).toEqual({
    intake: "closed",
    waiting: "pending",
  });
  const current = await workflow.task.get({ ...scope, taskId: task.id });
  expect(current).toMatchObject({
    stageId: "materials",
    status: "active",
    timer: null,
  });
  await expect(
    workflow.task.transition(step(waiting.revision, "reply")),
  ).rejects.toThrow("Reload the task");
  const assigned = await workflow.task.assign({
    ...scope,
    taskId: task.id,
    actorId,
    assigneeId: actorId,
    assigneeKind: "human",
    expectedRevision: current.revision,
    operationKey: randomUUID(),
  });
  const work = await workflow.task.getWork({
    ...scope,
    taskId: task.id,
    assigneeId: actorId,
    expectedAssignmentRevision: assigned.assignmentRevision,
  });
  expect(work).toMatchObject({
    stage: { id: "materials" },
    stageStates: { intake: "completed", materials: "current" },
  });
  const resumed = await workflow.task.transition(
    step(assigned.revision, "review"),
  );
  expect(resumed).toMatchObject({ stageId: "waiting", status: "waiting" });
  expect(await states(task.id)).toEqual({
    intake: "completed",
    materials: "completed",
    waiting: "current",
  });
  expect(
    (await workflow.task.history({ ...scope, taskId: task.id })).items.every(
      (e) => e.kind !== "stage-state",
    ),
  ).toBe(true);
});

it("runs an inserted admin stage before an existing action destination and resumes that destination on completion", async () => {
  const { workflow, scope, actorId, task, funnel, openInput } = await fixture();
  const stage = await workflow.stage.create({
    data: {
      key: "proof",
      name: "Proof",
      configuration: {
        instruction: "Collect proof",
        actions: [
          {
            id: "finish",
            name: "Finish",
            actors: ["manager"],
            evidence: ["manual"],
            outcome: "completed",
          },
        ],
      },
    },
  });
  const [waitingLink] = await workflow.funnelsToStages.find({
    params: {
      filters: {
        and: [
          { column: "funnelId", method: "eq", value: funnel.id },
          { column: "position", method: "eq", value: 1 },
        ],
      },
    },
  });
  await workflow.funnelsToStages.update({
    id: waitingLink.id,
    data: { position: 2 },
  });
  await workflow.funnelsToStages.create({
    data: { stageId: stage.id, funnelId: funnel.id, position: 1 },
  });
  const another = await workflow.task.open({
    ...openInput,
    operationKey: randomUUID(),
  });
  expect(await workflow.tasksToStages.stageStates(another.id)).toEqual({
    intake: "current",
    proof: "pending",
    waiting: "pending",
  });
  const scopeForTask = { ...scope, taskId: task.id };
  const current = await workflow.task.get(scopeForTask);
  expect(await workflow.tasksToStages.stageStates(task.id)).toEqual({
    intake: "current",
    proof: "required",
    waiting: "pending",
  });
  const command = {
    ...scopeForTask,
    actorId,
    actorKind: "manager" as const,
    evidence: { kind: "manual" as const, reason: "Verified" },
  };
  const proof = await workflow.task.transition({
    ...command,
    expectedRevision: current.revision,
    actionId: "wait",
    operationKey: randomUUID(),
  });
  expect(proof.stageId).toBe("proof");
  expect(await workflow.tasksToStages.stageStates(task.id)).toEqual({
    intake: "completed",
    proof: "current",
    waiting: "required",
  });
  const waiting = await workflow.task.transition({
    ...command,
    expectedRevision: proof.revision,
    actionId: "finish",
    operationKey: randomUUID(),
  });
  expect(waiting).toMatchObject({ status: "waiting", stageId: "waiting" });
  expect(await workflow.tasksToStages.stageStates(task.id)).toEqual({
    intake: "completed",
    proof: "completed",
    waiting: "current",
  });
});

it.each([
  ["new", "canceled"],
  ["paid", "canceled"],
  ["delivering", "delivering"],
  ["completed", "completed"],
])(
  "closes an unanswered task once and handles a %s order as %s",
  async (initial, expected) => {
    const { workflow, scope, actorId, task, funnel, saveInput } =
      await fixture();
    const taskScope = { ...scope, taskId: task.id };
    const data = {
      ...taskScope,
      actorKind: "manager" as const,
      actorId,
      evidence: { kind: "manual" as const, reason: "Customer confirmed" },
    };
    const ecommerce = workflow.task.modules.ecommerce;
    const order = await ecommerce.order.create({
      data: { type: "cart", status: "new" },
    });
    try {
      await ecommerce.storesToOrders.create({
        data: { storeId: scope.storeId, orderId: order.id },
      });
      await ecommerce.order.work.register({
        ...taskScope,
        customerId: task.customerId,
        orderId: order.id,
        kind: "individual-service",
      });
      if (initial !== "new") {
        await ecommerce.order.update({
          id: order.id,
          data: { status: initial, type: "history" },
        });
      }
      const linked = await workflow.task.attachOrder({
        ...taskScope,
        actorId,
        expectedRevision: task.revision,
        orderId: order.id,
        operationKey: randomUUID(),
      });
      const waiting = await workflow.task.transition({
        ...data,
        expectedRevision: linked.revision,
        actionId: "wait",
        operationKey: randomUUID(),
      });
      const evidence = await workflow.task.recordEvidence({
        ...data,
        expectedRevision: waiting.revision,
        operationKey: randomUUID(),
      });
      await workflow.funnel.save({
        ...saveInput,
        funnelId: funnel.id,
        expectedRevision: funnel.revision,
        definition: {
          ...discussion,
          stages: [
            ...discussion.stages,
            {
              id: "signoff",
              name: "Signoff",
              actions: [
                {
                  id: "finish",
                  name: "Finish",
                  actors: ["manager"],
                  evidence: ["manual"],
                  outcome: "completed",
                },
              ],
            },
          ],
        },
      });
      await getDrizzle({})
        .update(Task)
        .set({ deadlineAt: new Date(0), nextActionAt: new Date(0) })
        .where(eq(Task.id, task.id));
      const notice = { ...taskScope, timerKey: evidence.timer!.key };
      const result = await workflow.task.applyTimer(notice);
      expect(result.task).toMatchObject({
        stageId: "waiting",
        status: "closed",
        outcome: "closed-without-result",
      });
      expect(await ecommerce.order.findById({ id: order.id })).toMatchObject({
        status: expected,
        type: "history",
      });
      if (expected === "canceled") {
        expect(await ecommerce.order.work.findByOrder(order.id)).toMatchObject({
          state: "canceled",
        });
      }
      expect(await workflow.task.applyTimer(notice)).toMatchObject({
        event: { id: result.event!.id },
        applied: false,
      });
    } finally {
      await ecommerce.order.delete({ id: order.id });
    }
  },
);
