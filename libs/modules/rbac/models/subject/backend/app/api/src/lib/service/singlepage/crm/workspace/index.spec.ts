import { randomUUID } from "node:crypto";
import { STORE_EMPLOYEE_TRAINING_KEY_PREFIX } from "@sps/crm/models/task/sdk/model";
import { Service } from "./index";
import { Service as CrmFunnel } from "@sps/crm/models/funnel/backend/app/api/src/lib/service/singlepage";
import type { TCrmWorkspaceCommand } from "@sps/rbac/models/subject/sdk/model";
import { Service as AssignmentCandidates } from "./assignment-candidates";

function fixture() {
  const actorId = randomUUID();
  const assigneeId = randomUUID();
  const taskId = randomUUID();
  const storeId = randomUUID();
  const task = {
    id: taskId,
    storeId,
    revision: 3,
    assignmentRevision: 0,
    assigneeKind: null as "human" | "ai" | null,
    assigneeId: null as string | null,
    customerId: randomUUID(),
    orderId: null as string | null,
    stageId: "brief",
    openingKey: "customer-task",
  };
  const assigned = {
    ...task,
    assigneeId,
    assigneeKind: "ai",
    revision: 4,
    assignmentRevision: 1,
  };
  const get = jest.fn(async () => task);
  const originalBindings = {
    productIds: [randomUUID()],
    offerIds: [randomUUID()],
    formIds: [randomUUID()],
  };
  const getFunnelForEdit = jest.fn(async () => ({
    bindings: originalBindings,
    definition: { stages: [{ id: "reply" }] },
  }));
  const getFunnelBySlug = jest.fn();
  const findOffers = jest.fn().mockResolvedValue([]);
  const findProducts = jest.fn().mockResolvedValue([]);
  const saveFunnel = jest.fn(async (data) => data);
  const editFunnel = jest.fn();
  const selectProducts = CrmFunnel.prototype.selectProducts.bind({
    modules: { ecommerce: { storesToProducts: { find: findOffers } } },
  } as unknown as CrmFunnel);
  const assign = jest.fn(async () => assigned);
  const transition = jest.fn();
  const assignStageEmployee = jest.fn();
  const getFunnel = jest.fn().mockResolvedValue({ definition: { stages: [] } });
  const history = jest.fn().mockResolvedValue({ items: [], nextCursor: "2" });
  const stageStates = jest
    .fn()
    .mockResolvedValue({ brief: "completed", result: "current" });
  const workspaceCustomerName = jest.fn().mockResolvedValue(undefined);
  const list = jest.fn().mockResolvedValue({ items: [task], nextCursor: null });
  const findOrder = jest.fn();
  const findOrderWork = jest.fn();
  const ensureAssignedAgentInThread = jest.fn();
  const resumeAssignedReply = jest.fn();
  const queueStageEntry = jest.fn();
  const wakePendingWork = jest.fn();
  let inTaskTransaction = false;
  const service = new Service({
    isAdmin: jest.fn(async () => true),
    findById: jest.fn(async ({ id }: { id: string }) => ({ id, slug: id })),
    module: {
      subjectsToEcommerceModuleStores: { find: jest.fn(async () => []) },
      subjectsToSocialModuleProfiles: { find: jest.fn(async () => []) },
    },
    modules: {
      social: {
        chatsToCrmModuleTasks: { find: jest.fn().mockResolvedValue([]) },
      },
      ecommerce: {
        order: { findById: findOrder, work: { findByOrder: findOrderWork } },
        storesToProducts: { find: findOffers },
        product: { find: findProducts },
      },
      crm: {
        funnel: {
          get: getFunnelForEdit,
          getBySlug: getFunnelBySlug,
          save: saveFunnel,
          edit: editFunnel,
          selectProducts,
        },
        tasksToStages: {
          stageStates,
          visitedStageIds: jest.fn().mockResolvedValue(["brief", "result"]),
        },
        task: {
          get,
          getFunnel,
          history,
          list,
          assign,
          transition,
          withTask: jest.fn(
            async (
              _: unknown,
              action: (current: typeof task) => Promise<unknown>,
            ) => {
              inTaskTransaction = true;
              try {
                return await action(task);
              } finally {
                inTaskTransaction = false;
              }
            },
          ),
        },
      },
    },
    customerWork: {
      ensureAssignedAgentInThread,
      assignStageEmployee,
      resumeAssignedReply,
      queueStageEntry,
      wakePendingWork,
      workspaceChannel: jest.fn().mockResolvedValue(undefined),
      workspaceCustomerName,
      isAwaitingManager: jest.fn().mockResolvedValue(false),
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  jest.spyOn(service, "options").mockResolvedValue({
    canManageEmployees: true,
    participants: [{ id: assigneeId, name: "Редактор", kind: "ai" }],
    employees: [],
    payers: [],
    currencies: [],
    skillsByAssignee: {},
  });
  const assignment = {
    storeId,
    taskId,
    assigneeId,
    expectedRevision: task.revision,
    operationKey: randomUUID(),
  };
  return {
    service,
    actorId,
    assignment,
    task,
    assigned,
    assign,
    transition,
    assignStageEmployee,
    getFunnelForEdit,
    getFunnelBySlug,
    findOffers,
    findProducts,
    originalBindings,
    saveFunnel,
    editFunnel,
    getFunnel,
    history,
    stageStates,
    workspaceCustomerName,
    findOrder,
    findOrderWork,
    ensureAssignedAgentInThread,
    resumeAssignedReply,
    queueStageEntry,
    wakePendingWork,
    inTaskTransaction: () => inTaskTransaction,
  };
}

it("checks the store manager before listing orders and returns only the requested page", async () => {
  const storeId = randomUUID();
  const actorId = randomUUID();
  const createdAt = new Date("2026-11-01T10:00:00.000Z");
  const order = { id: randomUUID(), status: "paid", createdAt };
  const storeOrders = jest.fn().mockResolvedValue({ items: [order], total: 4 });
  const grants = jest.fn().mockResolvedValue([{ variant: "crm-worker" }]);
  const workspace = new Service({
    isAdmin: jest.fn().mockResolvedValue(false),
    module: { subjectsToEcommerceModuleStores: { find: grants } },
    repository: { storeOrders },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const page = { storeId, offset: 2, limit: 1 };
  await expect(workspace.orders(actorId, page)).rejects.toThrow("Permission");
  expect(storeOrders).not.toHaveBeenCalled();
  grants.mockResolvedValue([{ variant: "crm-manager" }]);
  await expect(workspace.orders(actorId, page)).resolves.toEqual({
    items: [
      {
        id: order.id,
        status: order.status,
        createdAt: createdAt.toISOString(),
      },
    ],
    total: 4,
    nextOffset: 3,
  });
  expect(storeOrders).toHaveBeenCalledWith(page);
});

it("assigns the employee to a task without an assignee and connects its conversation", async () => {
  const f = fixture();
  await expect(
    f.service.execute(f.actorId, { kind: "assign", assignment: f.assignment }),
  ).resolves.toMatchObject({
    kind: "assign",
    data: {
      id: f.task.id,
      assigneeId: f.assignment.assigneeId,
      assigneeKind: "ai",
    },
  });
  expect(f.assign).toHaveBeenCalledWith(
    { ...f.assignment, actorId: f.actorId, assigneeKind: "ai" },
    "manager",
    undefined,
  );
  expect(f.ensureAssignedAgentInThread).toHaveBeenCalledWith(f.assigned);
});

it("uses the same chat roster in detail and assignment and attaches only the selected profile inside the transaction", async () => {
  const f = fixture();
  const channel = {
    id: randomUUID(),
    chatId: randomUUID(),
    threadId: randomUUID(),
    title: "Task chat",
    consultationTaskId: null,
    memoryProjectId: null,
  };
  const person = {
    id: f.assignment.assigneeId,
    name: "Operator",
    kind: "human" as const,
    profileId: randomUUID(),
  };
  jest.spyOn(f.service, "taskAccess").mockResolvedValue({
    canManageTasks: true,
    canManageEmployees: false,
    canReadCosts: false,
  });
  jest
    .mocked(f.service.subject.customerWork.workspaceChannel)
    .mockResolvedValue(channel);
  Object.assign(f.service.subject.module, {
    subjectsToSocialModuleProfiles: { find: jest.fn().mockResolvedValue([]) },
  });
  f.assign.mockResolvedValue({ ...f.assigned, assigneeKind: "human" });
  const read = jest
    .spyOn(AssignmentCandidates.prototype, "read")
    .mockResolvedValue([person]);
  const attach = jest
    .spyOn(AssignmentCandidates.prototype, "attach")
    .mockImplementation(async () => {
      expect(f.inTaskTransaction()).toBe(true);
    });
  try {
    await expect(
      f.service.detail(f.actorId, {
        storeId: f.task.storeId,
        taskId: f.task.id,
      }),
    ).resolves.toMatchObject({ assignmentCandidates: [person] });
    expect(attach).not.toHaveBeenCalled();
    await expect(
      f.service.execute(f.actorId, {
        kind: "assign",
        assignment: { ...f.assignment, assigneeId: randomUUID() },
      }),
    ).rejects.toThrow("assignee must be available for this task");
    expect(f.assign).not.toHaveBeenCalled();
    await f.service.execute(f.actorId, {
      kind: "assign",
      assignment: f.assignment,
    });
    expect(attach).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledWith(channel.chatId, person.profileId);
    expect(read.mock.calls).toEqual([
      [f.task, channel],
      [f.task, channel],
      [f.task, channel],
    ]);
    Object.assign(f.task, { status: "closed" });
    await expect(
      f.service.detail(f.actorId, {
        storeId: f.task.storeId,
        taskId: f.task.id,
      }),
    ).resolves.toMatchObject({ assignmentCandidates: [person] });
    await expect(
      f.service.execute(f.actorId, {
        kind: "assign",
        assignment: f.assignment,
      }),
    ).rejects.toThrow("The task is closed");
    expect(f.assign).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(1);
  } finally {
    read.mockRestore();
    attach.mockRestore();
  }
});

it("wakes the newly queued reply only after the assignment transaction and skips replaying an unchanged assignment", async () => {
  const f = fixture();
  const revised = { ...f.assigned, revision: 5 };
  f.resumeAssignedReply.mockImplementation(async () => {
    expect(f.inTaskTransaction()).toBe(true);
    return revised;
  });
  f.wakePendingWork.mockImplementation(() => {
    expect(f.inTaskTransaction()).toBe(false);
  });
  const command = { kind: "assign" as const, assignment: f.assignment };
  await expect(f.service.execute(f.actorId, command)).resolves.toMatchObject({
    data: { revision: revised.revision },
  });
  expect(f.resumeAssignedReply).toHaveBeenCalledWith(f.assigned, f.actorId);
  expect(f.wakePendingWork).toHaveBeenCalledWith(f.task.id);
  Object.assign(f.task, revised);
  f.assign.mockResolvedValue(revised);
  await f.service.execute(f.actorId, command);
  expect(f.resumeAssignedReply).toHaveBeenCalledTimes(1);
  expect(f.wakePendingWork).toHaveBeenCalledTimes(1);
});

it("resumes an unanswered reply after a manual CRM transition assigns another agent", async () => {
  const f = fixture();
  const nextStage = {
    id: "next",
    defaultAssigneeSubjectId: f.assigned.assigneeId,
  };
  const moved = { ...f.task, stageId: nextStage.id, revision: 4 };
  const assigned = { ...f.assigned, stageId: nextStage.id, revision: 5 };
  const resumed = { ...assigned, revision: 6 };
  f.getFunnel.mockResolvedValue({
    definition: { stages: [{ id: f.task.stageId }, nextStage] },
  });
  f.transition.mockResolvedValue(moved);
  f.assignStageEmployee.mockResolvedValue(assigned);
  f.resumeAssignedReply.mockResolvedValue(resumed);
  f.wakePendingWork.mockImplementation(() =>
    expect(f.inTaskTransaction()).toBe(false),
  );
  const { storeId, taskId, expectedRevision } = f.assignment;
  const command = {
    kind: "transition" as const,
    transition: {
      storeId,
      taskId,
      expectedRevision,
      operationKey: randomUUID(),
      actionId: "move",
      reason: "Move the task",
    },
  };
  await expect(f.service.execute(f.actorId, command)).resolves.toMatchObject({
    data: { stageId: nextStage.id, revision: resumed.revision },
  });
  expect(f.assignStageEmployee).toHaveBeenCalledWith(moved, nextStage);
  expect(f.resumeAssignedReply).toHaveBeenCalledWith(assigned, f.actorId);
  expect(f.wakePendingWork).toHaveBeenCalledTimes(1);

  f.assignStageEmployee.mockResolvedValue(moved);
  await f.service.execute(f.actorId, command);
  expect(f.resumeAssignedReply).toHaveBeenCalledTimes(1);
  expect(f.wakePendingWork).toHaveBeenCalledTimes(1);
});

it("continues an opted-in cover after a manual transition with the same assignee", async () => {
  const f = fixture();
  const stage = {
    id: "image",
    output: "image",
    imageBrief: "marketplace-cover",
    imageBriefAutoGenerate: true,
  };
  const moved = {
    ...f.task,
    orderId: randomUUID(),
    stageId: stage.id,
    revision: 4,
  };
  f.getFunnel.mockResolvedValue({
    definition: { stages: [{ id: f.task.stageId }, stage] },
  });
  f.transition.mockResolvedValue(moved);
  f.assignStageEmployee.mockResolvedValue(moved);
  f.queueStageEntry.mockResolvedValue({ ...moved, revision: 5 });
  const { storeId, taskId, expectedRevision } = f.assignment;
  await expect(
    f.service.execute(f.actorId, {
      kind: "transition",
      transition: {
        storeId,
        taskId,
        expectedRevision,
        operationKey: randomUUID(),
        actionId: "make",
        reason: "Brief is ready",
      },
    }),
  ).resolves.toMatchObject({ data: { stageId: stage.id, revision: 5 } });
  expect(f.queueStageEntry).toHaveBeenCalledWith(moved);
  expect(f.wakePendingWork).toHaveBeenCalledTimes(1);
  expect(f.resumeAssignedReply).not.toHaveBeenCalled();
});

it("lets a manager who owns a legacy test as buyer take the task, then return it to its stage agent", async () => {
  const f = fixture();
  f.task.customerId = f.actorId;
  f.task.openingKey = "store-test:legacy";
  f.task.assigneeId = f.assignment.assigneeId;
  f.task.assigneeKind = "ai";
  const agent = {
    id: f.assignment.assigneeId,
    name: "Редактор",
    kind: "ai" as const,
  };
  const manager = { id: f.actorId, name: "Менеджер", kind: "human" as const };
  jest.mocked(f.service.options).mockResolvedValue({
    ...(await f.service.options(f.actorId, f.task.storeId)),
    participants: [agent, manager],
  });
  f.getFunnel.mockResolvedValue({
    definition: {
      stages: [{ id: "brief", defaultAssigneeSubjectId: agent.id }],
    },
  });
  const taken = {
    ...f.task,
    assigneeId: manager.id,
    assigneeKind: "human",
    revision: 4,
  };
  f.assign.mockResolvedValueOnce(taken);
  await expect(
    f.service.execute(manager.id, {
      kind: "assign",
      assignment: { ...f.assignment, assigneeId: manager.id },
    }),
  ).resolves.toMatchObject({
    data: { assigneeKind: "human", assigneeId: manager.id },
  });
  expect(f.assign).toHaveBeenLastCalledWith(
    expect.objectContaining({ assigneeKind: "human" }),
    "manager",
    undefined,
  );
  Object.assign(f.task, taken);

  await expect(
    f.service.execute(manager.id, {
      kind: "assign",
      assignment: {
        ...f.assignment,
        operationKey: randomUUID(),
        expectedRevision: 4,
      },
    }),
  ).resolves.toMatchObject({
    data: { assigneeKind: "ai", assigneeId: agent.id },
  });
  expect(f.assign).toHaveBeenLastCalledWith(
    expect.objectContaining({ assigneeKind: "ai" }),
    "manager",
    "stage",
  );
  expect(f.ensureAssignedAgentInThread).toHaveBeenLastCalledWith(f.assigned);
});

it("offers a buyer handoff only to a real manager of the exact store", async () => {
  const storeId = randomUUID();
  const buyer = { id: randomUUID(), variant: "default" };
  const automated = { id: randomUUID(), variant: "agent" };
  const manager = { id: randomUUID(), variant: "default" };
  const grants = [
    { subjectId: buyer.id, ecommerceModuleStoreId: storeId, variant: "owner" },
    {
      subjectId: automated.id,
      ecommerceModuleStoreId: storeId,
      variant: "crm-manager",
    },
    {
      subjectId: manager.id,
      ecommerceModuleStoreId: randomUUID(),
      variant: "crm-manager",
    },
  ];
  const findGrants = jest.fn().mockResolvedValue(grants);
  const service = new Service({
    findById: async ({ id }: { id: string }) =>
      [buyer, automated, manager].find((person) => person.id === id),
    module: { subjectsToEcommerceModuleStores: { find: findGrants } },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  await expect(service.hasHandoffManager(storeId, buyer.id)).resolves.toBe(
    false,
  );
  grants.push({
    subjectId: manager.id,
    ecommerceModuleStoreId: storeId,
    variant: "crm-manager",
  });
  await expect(service.hasHandoffManager(storeId, buyer.id)).resolves.toBe(
    true,
  );
  expect(findGrants).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          { column: "ecommerceModuleStoreId", method: "eq", value: storeId },
        ],
      },
    },
  });
});

it("includes recorded stage visits separately from a paginated history page", async () => {
  const f = fixture();
  jest.spyOn(f.service, "taskAccess").mockResolvedValue({
    canManageTasks: true,
    canReadCosts: false,
    canManageEmployees: false,
  });
  const { storeId, taskId } = f.assignment;
  await expect(
    f.service.detail(f.actorId, { storeId, taskId, limit: 1 }),
  ).resolves.toMatchObject({
    stageStates: { brief: "completed", result: "current" },
    history: { items: [], nextCursor: "2" },
  });
  expect(f.stageStates).toHaveBeenCalledWith(taskId);
});

it("projects the task buyer’s public profile name on both CRM reads and keeps the historical label when unresolved", async () => {
  const f = fixture();
  jest.spyOn(f.service, "taskAccess").mockResolvedValue({
    canManageTasks: true,
    canReadCosts: false,
    canManageEmployees: false,
  });
  const { storeId, taskId } = f.assignment;
  f.workspaceCustomerName
    .mockResolvedValueOnce("Марина Лапина")
    .mockResolvedValueOnce("Марина Лапина");
  await expect(f.service.tasks(f.actorId, { storeId })).resolves.toMatchObject({
    items: [{ customerName: "Марина Лапина" }],
  });
  await expect(
    f.service.detail(f.actorId, { storeId, taskId }),
  ).resolves.toMatchObject({ task: { customerName: "Марина Лапина" } });
  await expect(
    f.service.detail(f.actorId, { storeId, taskId }),
  ).resolves.toMatchObject({ task: { customerName: f.task.customerId } });
});

it.each([
  ["original recorded", true, true],
  ["receipt only", false, false],
] as const)(
  "reports payment and original delivery separately when %s",
  async (_, hasResult, originalDelivered) => {
    const f = fixture();
    jest.spyOn(f.service, "taskAccess").mockResolvedValue({
      canManageTasks: true,
      canReadCosts: false,
      canManageEmployees: false,
    });
    const orderId = randomUUID();
    f.task.orderId = orderId;
    f.findOrder.mockResolvedValue({ id: orderId, status: "delivered" });
    f.findOrderWork.mockResolvedValue({
      orderId,
      storeId: f.task.storeId,
      taskId: f.task.id,
      customerId: f.task.customerId,
      kind: "individual-service",
      state: "delivered",
      paid: { id: "payment", fileId: hasResult ? "preview" : null },
      files: hasResult ? [{ id: "preview", originalFileId: "original" }] : [],
      receiptFileId: "receipt",
      resultFileId: hasResult ? "original" : null,
      deliveredAt: new Date(),
    });
    const { storeId, taskId } = f.assignment;
    await expect(
      f.service.detail(f.actorId, { storeId, taskId }),
    ).resolves.toMatchObject({
      order: {
        id: orderId,
        status: "delivered",
        paymentStatus: "paid",
        workState: "delivered",
        originalDelivered,
      },
    });
  },
);

it("finds an administrator's store by exact slug beyond the workspace list", async () => {
  const actorId = randomUUID();
  const hiddenStore = {
    id: randomUUID(),
    slug: "target-store",
    adminTitle: "Target store",
  };
  const listedStores = Array.from({ length: 100 }, (_, index) => ({
    id: randomUUID(),
    slug: `store-${index}`,
    adminTitle: `Store ${index}`,
  }));
  const findStores = jest
    .fn()
    .mockResolvedValueOnce(listedStores)
    .mockResolvedValueOnce([hiddenStore]);
  const findGrants = jest.fn().mockResolvedValue([]);
  const storeProductCounts = jest
    .fn()
    .mockResolvedValue([{ storeId: listedStores[0].id, count: 5 }]);
  const storeEmployeeCounts = jest.fn().mockResolvedValue([]);
  const service = new Service({
    isAdmin: jest.fn().mockResolvedValue(true),
    repository: { storeProductCounts, storeEmployeeCounts },
    module: { subjectsToEcommerceModuleStores: { find: findGrants } },
    modules: { ecommerce: { store: { find: findStores } } },
  } as unknown as ConstructorParameters<typeof Service>[0]);

  const list = await service.stores(actorId);
  expect(list).toHaveLength(100);
  expect(list[0]).toMatchObject({ productCount: 5, employeeCount: 0 });
  expect(list[1]).toMatchObject({ productCount: 0, employeeCount: 0 });
  expect(list.map(({ slug }) => slug)).not.toContain(hiddenStore.slug);
  await expect(service.stores(actorId, hiddenStore.slug)).resolves.toEqual([
    {
      id: hiddenStore.id,
      slug: hiddenStore.slug,
      title: hiddenStore.adminTitle,
      canManageTasks: true,
      canManageCatalog: true,
      canManageEmployees: true,
      canManageProviderSettings: false,
      canReadCosts: true,
    },
  ]);
  const storeIds = listedStores.map(({ id }) => id);
  expect(storeProductCounts).toHaveBeenCalledTimes(1);
  expect(storeProductCounts).toHaveBeenCalledWith(storeIds, storeIds);
  expect(storeEmployeeCounts).toHaveBeenCalledTimes(1);
  expect(findStores).toHaveBeenNthCalledWith(1, { params: { limit: 100 } });
  expect(findStores).toHaveBeenNthCalledWith(2, {
    params: {
      limit: 1,
      filters: {
        and: [{ column: "slug", method: "eq", value: hiddenStore.slug }],
      },
    },
  });
});

it("checks only the caller's grants for the store matched by slug", async () => {
  const actorId = randomUUID();
  const store = { id: randomUUID(), slug: "target-store", adminTitle: "Store" };
  const findStores = jest.fn().mockResolvedValue([store]);
  const findGrants = jest
    .fn()
    .mockResolvedValueOnce([
      { variant: "crm-worker", ecommerceModuleStoreId: store.id },
    ])
    .mockResolvedValueOnce([
      { variant: "crm-manager-finance", ecommerceModuleStoreId: store.id },
    ])
    .mockResolvedValueOnce([
      { variant: "owner", ecommerceModuleStoreId: store.id },
    ]);
  const service = new Service({
    isAdmin: jest.fn().mockResolvedValue(false),
    module: { subjectsToEcommerceModuleStores: { find: findGrants } },
    modules: { ecommerce: { store: { find: findStores } } },
  } as unknown as ConstructorParameters<typeof Service>[0]);

  await expect(service.stores(actorId, store.slug)).resolves.toEqual([]);
  await expect(service.stores(actorId, store.slug)).resolves.toMatchObject([
    {
      id: store.id,
      slug: store.slug,
      canReadCosts: true,
      canManageEmployees: false,
      canManageProviderSettings: false,
    },
  ]);
  await expect(service.stores(actorId, store.slug)).resolves.toMatchObject([
    { id: store.id, canManageProviderSettings: true },
  ]);
  expect(findGrants).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          { column: "subjectId", method: "eq", value: actorId },
          { column: "ecommerceModuleStoreId", method: "eq", value: store.id },
        ],
      },
    },
  });

  findStores.mockResolvedValueOnce([]);
  await expect(service.stores(actorId, "missing-store")).resolves.toEqual([]);
  expect(findGrants).toHaveBeenCalledTimes(3);
});

it("withholds training tasks from CRM detail and assignments", async () => {
  const f = fixture();
  f.task.openingKey = `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}private`;
  const { storeId, taskId } = f.assignment;
  await expect(
    f.service.detail(f.actorId, { storeId, taskId }),
  ).rejects.toThrow("Not Found error");
  await expect(
    f.service.execute(f.actorId, { kind: "assign", assignment: f.assignment }),
  ).rejects.toThrow("Not Found error");
  expect(f.getFunnel).not.toHaveBeenCalled();
  expect(f.history).not.toHaveBeenCalled();
  expect(f.stageStates).not.toHaveBeenCalled();
  expect(f.assign).not.toHaveBeenCalled();
});

it("scopes every independent funnel command and returns the same linked products as the editor read", async () => {
  const f = fixture();
  const base = {
    storeId: f.task.storeId,
    funnelId: randomUUID(),
    expectedRevision: 3,
  };
  const product = { id: randomUUID(), title: { ru: "Товар" } };
  const offer = { id: randomUUID(), productId: product.id };
  const saved = {
    ...base,
    id: base.funnelId,
    bindings: { productIds: [], offerIds: [offer.id], formIds: [] },
    definition: {
      initialStageId: "brief",
      stages: [{ id: "brief", name: "Бриф", actions: [] }],
    },
  };
  f.editFunnel.mockResolvedValue(saved);
  f.findOffers.mockResolvedValue([offer]);
  f.findProducts.mockResolvedValue([product]);
  const commands: TCrmWorkspaceCommand[] = [
    { kind: "save-funnel-settings", funnel: { ...base, name: "Воронка" } },
    {
      kind: "save-funnel-stage",
      funnel: { ...base, stage: saved.definition.stages[0] },
    },
    {
      kind: "move-funnel-stage",
      funnel: { ...base, stageId: "brief", targetStageId: "review" },
    },
    {
      kind: "delete-funnel-stage",
      funnel: { ...base, stageId: "review", targetStageId: "brief" },
    },
  ];
  for (const command of commands) {
    await expect(f.service.execute(f.actorId, command)).resolves.toMatchObject({
      kind: command.kind,
      data: { linkedProducts: [{ id: product.id, title: "Товар" }] },
    });
  }
  expect(f.editFunnel).toHaveBeenCalledTimes(4);
  // Exercise the real options access check for stage edits as well.
  jest.mocked(f.service.options).mockRestore();
  jest.spyOn(f.service, "taskAccess").mockResolvedValue({
    canManageTasks: false,
    canReadCosts: false,
    canManageEmployees: false,
  });
  for (const command of commands) {
    await expect(f.service.execute(f.actorId, command)).rejects.toThrow(
      "Store CRM access",
    );
  }
  expect(f.editFunnel).toHaveBeenCalledTimes(4);
});

it("validates the saved stage employee in the selected store", async () => {
  const f = fixture();
  const command = {
    kind: "save-funnel-stage" as const,
    funnel: {
      storeId: f.task.storeId,
      funnelId: randomUUID(),
      expectedRevision: 3,
      stage: {
        id: "brief",
        name: "Brief",
        actions: [],
        defaultAssigneeSubjectId: randomUUID(),
      },
    },
  };
  f.editFunnel.mockImplementation(async (_command, _actor, options) => {
    const definition = {
      initialStageId: "brief",
      stages: [command.funnel.stage],
    };
    await options.validateStage(definition, { definition });
    throw new Error("Stage validation should have rejected the assignee");
  });
  await expect(f.service.execute(f.actorId, command)).rejects.toThrow(
    "assignee must be linked to this store",
  );
});

it("updates the live funnel and preserves form and offer bindings", async () => {
  const f = fixture();
  const productIds = [randomUUID()];
  const funnel = {
    storeId: f.task.storeId,
    funnelId: randomUUID(),
    expectedRevision: 3,
    kind: "consultation" as const,
    name: "Consultation",
    definition: {
      initialStageId: "reply",
      stages: [{ id: "reply", name: "Reply", actions: [] }],
    },
  };

  await expect(
    f.service.execute(f.actorId, {
      kind: "save",
      funnel: { ...funnel, productIds },
    }),
  ).resolves.toMatchObject({ kind: "save", data: { name: funnel.name } });

  expect(f.getFunnelForEdit).toHaveBeenCalledWith(
    funnel.storeId,
    funnel.funnelId,
    false,
  );
  expect(f.saveFunnel).toHaveBeenCalledWith({
    ...funnel,
    bindings: { ...f.originalBindings, productIds },
  });
});

it("keeps the selected historical offers scoped, and clears all bindings for a deselected product on reread", async () => {
  const f = fixture();
  const storeId = f.task.storeId;
  const legacyProduct = { id: randomUUID(), title: { ru: "Скрытый товар" } };
  const removedProduct = { id: randomUUID(), title: { ru: "Удаляемая связь" } };
  const newProduct = { id: randomUUID(), title: { ru: "Новый товар" } };
  const foreignProduct = { id: randomUUID(), title: { ru: "Чужой товар" } };
  const makeOffer = (productId: string, offerStore = storeId) => ({
    id: randomUUID(),
    productId,
    storeId: offerStore,
  });
  const legacyOffer = makeOffer(legacyProduct.id);
  const removedOffers = [
    makeOffer(removedProduct.id),
    makeOffer(removedProduct.id),
  ];
  const foreignOffer = makeOffer(foreignProduct.id, randomUUID());
  const offers = [
    legacyOffer,
    ...removedOffers,
    makeOffer(newProduct.id),
    foreignOffer,
  ];
  const products = [legacyProduct, removedProduct, newProduct, foreignProduct];
  const formIds = [randomUUID()];
  const name = "Consultation";
  const definition = {
    initialStageId: "reply",
    stages: [{ id: "reply", name: "Reply", actions: [] }],
  };
  let persisted = {
    id: randomUUID(),
    slug: "consultation",
    storeId,
    name,
    kind: "consultation" as const,
    revision: 3,
    definition,
    bindings: {
      productIds: [removedProduct.id],
      offerIds: [
        legacyOffer.id,
        ...removedOffers.map(({ id }) => id),
        foreignOffer.id,
      ],
      formIds,
    },
  };
  const input = { storeId, funnelSlug: persisted.slug };
  f.getFunnelBySlug.mockImplementation(async () => persisted);
  f.getFunnelForEdit.mockImplementation(async () => persisted);
  f.findOffers.mockImplementation(
    async ({
      params: {
        filters: { and },
      },
    }) => {
      type TOffer = typeof legacyOffer;
      return offers.filter((offer) =>
        and.every(
          ({
            column,
            method,
            value,
          }: {
            column: keyof TOffer;
            method: string;
            value: string | string[];
          }) =>
            method === "eq"
              ? offer[column] === value
              : value.includes(offer[column]),
        ),
      );
    },
  );
  f.findProducts.mockImplementation(
    async ({
      params: {
        filters: { and },
      },
    }) => products.filter(({ id }) => and[0].value.includes(id)),
  );
  f.saveFunnel.mockImplementation(async (data) => {
    persisted = {
      ...persisted,
      bindings: data.bindings,
      revision: persisted.revision + 1,
    };
    return persisted;
  });

  await expect(f.service.funnel(f.actorId, input)).resolves.toMatchObject({
    linkedProducts: [
      { id: removedProduct.id, title: removedProduct.title.ru },
      { id: legacyProduct.id, title: legacyProduct.title.ru },
    ],
  });
  expect(f.getFunnelBySlug).toHaveBeenCalledWith(input, true);
  await f.service.execute(f.actorId, {
    kind: "save",
    funnel: {
      storeId,
      funnelId: persisted.id,
      expectedRevision: persisted.revision,
      name,
      kind: persisted.kind,
      definition,
      linkedProductIds: [legacyProduct.id, newProduct.id],
    },
  });
  expect(persisted.bindings).toEqual({
    productIds: [newProduct.id],
    offerIds: [legacyOffer.id],
    formIds,
  });
  await expect(f.service.funnel(f.actorId, input)).resolves.toMatchObject({
    linkedProducts: [
      { id: newProduct.id, title: newProduct.title.ru },
      { id: legacyProduct.id, title: legacyProduct.title.ru },
    ],
  });
});

it("resolves employee profiles only in the requested store and keeps training permission separate", async () => {
  const storeId = randomUUID();
  const otherStoreId = randomUUID();
  const ownerId = randomUUID();
  const managerId = randomUUID();
  const humanId = randomUUID();
  const agentId = randomUUID();
  const assistantId = randomUUID();
  const customerId = randomUUID();
  const otherAgentId = randomUUID();
  const links = [
    { subjectId: ownerId, ecommerceModuleStoreId: storeId, variant: "owner" },
    {
      subjectId: managerId,
      ecommerceModuleStoreId: storeId,
      variant: "crm-manager",
    },
    {
      subjectId: humanId,
      ecommerceModuleStoreId: storeId,
      variant: "crm-worker",
    },
    {
      subjectId: agentId,
      ecommerceModuleStoreId: storeId,
      variant: "crm-agent",
    },
    {
      subjectId: assistantId,
      ecommerceModuleStoreId: storeId,
      variant: "assistant",
      customerSubjectId: customerId,
    },
    {
      subjectId: otherAgentId,
      ecommerceModuleStoreId: otherStoreId,
      variant: "crm-agent",
    },
  ];
  const previous = jest
    .fn()
    .mockResolvedValue({ items: [{ id: randomUUID() }] });
  const profile = {
    id: randomUUID(),
    variant: "artificial-intelligence",
    title: { ru: "Редактор" },
  };
  const service = new Service({
    isAdmin: jest.fn().mockResolvedValue(false),
    findById: jest.fn(async ({ id }: { id: string }) => ({
      id,
      slug: id === humanId ? "staff-member" : id,
      variant: [agentId, otherAgentId, assistantId].includes(id)
        ? "agent"
        : "default",
    })),
    module: {
      subjectsToEcommerceModuleStores: {
        find: jest.fn(
          async ({
            params,
          }: {
            params: {
              filters: {
                and: { column: keyof (typeof links)[number]; value: string }[];
              };
            };
          }) =>
            links.filter((link) =>
              params.filters.and.every(
                ({ column, value }) => link[column] === value,
              ),
            ),
        ),
      },
      subjectsToSocialModuleProfiles: {
        find: jest.fn(
          async ({
            params,
          }: {
            params: { filters: { and: { value: string }[] } };
          }) =>
            params.filters.and.some(
              ({ value }) => value === agentId || value === profile.id,
            )
              ? [{ subjectId: agentId, socialModuleProfileId: profile.id }]
              : [],
        ),
      },
    },
    modules: {
      crm: { task: { list: previous } },
      social: {
        profile: { findById: jest.fn().mockResolvedValue(profile) },
        chat: { find: jest.fn().mockResolvedValue([]) },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);

  await expect(
    service.employeeDetail(ownerId, { storeId, subjectId: agentId }),
  ).resolves.toEqual({
    id: agentId,
    name: "Редактор",
    kind: "ai",
    canTrain: true,
  });
  await expect(
    service.employeeDetail(managerId, { storeId, subjectId: agentId }),
  ).resolves.toMatchObject({
    id: agentId,
    canTrain: false,
  });
  await expect(
    service.employeeDetail(managerId, { storeId, subjectId: otherAgentId }),
  ).rejects.toThrow("Not Found");
  await expect(
    service.employeeDetail(humanId, { storeId, subjectId: humanId }),
  ).resolves.toEqual({
    id: humanId,
    name: "staff-member",
    kind: "human",
    canTrain: false,
  });
  await expect(
    service.employeeDetail(humanId, { storeId, subjectId: agentId }),
  ).rejects.toThrow("Permission");
  await expect(
    service.employeeDetail(managerId, { storeId, subjectId: assistantId }),
  ).resolves.toEqual({
    id: assistantId,
    name: "Личный ассистент",
    kind: "ai",
    canTrain: false,
  });
  expect(previous).toHaveBeenCalledWith({
    storeId,
    assigneeId: assistantId,
    customerId,
    limit: 1,
  });
  previous.mockResolvedValueOnce({ items: [] });
  await expect(
    service.employeeDetail(managerId, { storeId, subjectId: assistantId }),
  ).rejects.toThrow("Not Found");
});

function conversation(variant: "crm-manager" | "crm-worker" | "owner") {
  const actorId = randomUUID();
  const scope = {
    storeId: randomUUID(),
    taskId: randomUUID(),
    chatId: randomUUID(),
    threadId: randomUUID(),
  };
  const task = {
    id: scope.taskId,
    storeId: scope.storeId,
    customerId: randomUUID(),
    openingKey: "customer-order",
    assigneeId: randomUUID(),
    assigneeKind: "human",
    status: "active",
    orderId: null as string | null,
    outcome: null as string | null,
  };
  const message = { id: randomUUID(), description: "Task message" };
  const action = { id: randomUUID(), variant: "ai-execution" };
  const profile = {
    id: "actor-profile",
    title: { en: "Staff" },
    metadata: { privateNote: "Personal note" },
    allowedMcpServerIds: ["singlepagestartup"],
  };
  const customerWork = {
    workspaceChannel: jest.fn(async () => scope),
    postTaskMessage: jest.fn(async () => message),
    wakePendingWork: jest.fn(),
    threadAttachment: jest.fn(async () => ({ name: "brief.txt" })),
  };
  const social = {
    chatsToCrmModuleTasks: { forThread: jest.fn() },
    thread: { findById: jest.fn() },
    chatsToMessages: { find: jest.fn(async () => [{ messageId: message.id }]) },
    threadsToMessages: {
      find: jest.fn(async () => [{ messageId: message.id }]),
    },
    message: { find: jest.fn(async () => [message]) },
    chatsToActions: { find: jest.fn(async () => [{ actionId: action.id }]) },
    threadsToActions: { find: jest.fn(async () => [{ actionId: action.id }]) },
    action: { find: jest.fn(async () => [action]) },
    profilesToActions: { find: jest.fn(async () => []) },
    profilesToChats: {
      find: jest.fn(async ({ params }) =>
        params.filters.and.some(
          (filter: { column: string; value: string }) =>
            filter.column === "variant" && filter.value === "participant",
        )
          ? []
          : [{ chatId: scope.chatId, profileId: profile.id }],
      ),
    },
    profilesToMessages: {
      find: jest.fn(async () => [
        { messageId: message.id, profileId: "actor-profile" },
      ]),
    },
    profile: {
      findById: jest.fn(async () => profile),
      find: jest.fn(async () => [profile]),
      profilePresentation: jest.fn(async () => ({
        id: "actor-profile",
        title: { en: "Staff" },
        subtitle: {},
        avatar: null,
      })),
    },
    messagesToFileStorageModuleFiles: { find: jest.fn(async () => []) },
  };
  const orderWork = { findByOrder: jest.fn() };
  const privateFiles = { findById: jest.fn() };
  const service = new Service({
    repository: { withSubjectLock: jest.fn(async (_, action) => action()) },
    isAdmin: jest.fn(async () => false),
    module: {
      subjectsToSocialModuleProfiles: {
        find: jest.fn(async () => [{ socialModuleProfileId: profile.id }]),
      },
      subjectsToEcommerceModuleStores: {
        find: jest.fn(async () => [{ variant }]),
      },
    },
    modules: {
      social,
      ecommerce: { order: { work: orderWork } },
      fileStorage: { file: { privateContent: privateFiles } },
      crm: {
        task: {
          get: jest.fn(async () => task),
          withTask: jest.fn(async (_, fn) => fn(task)),
        },
      },
    },
    customerWork,
  } as unknown as ConstructorParameters<typeof Service>[0]);
  return {
    actorId,
    scope,
    service,
    task,
    message,
    action,
    profile,
    social,
    customerWork,
    orderWork,
    privateFiles,
  };
}

it("lets managers read and reply in the task chat while another employee is assigned", async () => {
  const {
    service,
    scope,
    actorId,
    message,
    action,
    profile,
    customerWork,
    social,
  } = conversation("crm-manager");
  await expect(service.thread(actorId, scope)).resolves.toMatchObject({
    canSend: true,
    messages: [{ id: message.id }],
    actions: [{ id: action.id }],
    participants: [{ ...profile, metadata: {}, allowedMcpServerIds: [] }],
  });
  expect(social.threadsToMessages.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "threadId", method: "eq", value: scope.threadId }],
      },
    },
  });
  await expect(
    service.thread(actorId, { ...scope, threadId: randomUUID() }),
  ).rejects.toThrow("task conversation is unavailable");
  await expect(
    service.thread(actorId, { ...scope, chatId: randomUUID() }),
  ).rejects.toThrow("task conversation is unavailable");
  await expect(
    service.send(actorId, scope, { text: "Reply", operationKey: randomUUID() }),
  ).resolves.toMatchObject({ id: message.id });
  expect(customerWork.postTaskMessage).toHaveBeenCalledTimes(1);
});

it("lets a store worker reply only while the worker is the exact human assignee", async () => {
  const { service, scope, actorId, task, message, customerWork } =
    conversation("crm-worker");
  const reply = { text: "Reply", operationKey: randomUUID() };
  await expect(service.thread(actorId, scope)).rejects.toThrow(
    "CRM task is unavailable",
  );
  task.assigneeId = actorId;
  await expect(service.thread(actorId, scope)).resolves.toMatchObject({
    canSend: true,
  });
  await expect(service.send(actorId, scope, reply)).resolves.toMatchObject({
    id: message.id,
    authorProfileIds: ["actor-profile"],
  });
  expect(customerWork.postTaskMessage).toHaveBeenCalledWith(task, {
    customerId: actorId,
    profileId: "actor-profile",
    chatId: scope.chatId,
    threadId: scope.threadId,
    text: reply.text,
    sourceSystemId: reply.operationKey,
    hasAttachments: false,
    attachments: undefined,
  });
  task.assigneeId = randomUUID();
  await expect(service.send(actorId, scope, reply)).rejects.toThrow(
    "CRM task is unavailable",
  );
});

it("checks attachment membership after authorizing the exact task and thread", async () => {
  const { service, scope, actorId, message, customerWork, social } =
    conversation("crm-manager");
  const attachment = { messageId: message.id, attachmentId: randomUUID() };
  await expect(service.attachment(actorId, scope, attachment)).resolves.toEqual(
    { name: "brief.txt" },
  );
  expect(customerWork.threadAttachment).toHaveBeenCalledWith({
    threadId: scope.threadId,
    ...attachment,
  });
  social.chatsToMessages.find.mockResolvedValueOnce([]);
  await expect(service.attachment(actorId, scope, attachment)).rejects.toThrow(
    "message attachment is unavailable",
  );
  expect(customerWork.threadAttachment).toHaveBeenCalledTimes(1);
});

it("keeps an authorized worker in the completed order discussion without waking work", async () => {
  const { service, scope, actorId, task, message, customerWork } =
    conversation("crm-worker");
  task.assigneeId = actorId;
  task.status = "closed";
  task.orderId = randomUUID();
  task.outcome = "completed";
  const reply = { text: "Reply", operationKey: randomUUID() };
  await expect(service.thread(actorId, scope)).resolves.toMatchObject({
    canSend: true,
  });
  await expect(service.send(actorId, scope, reply)).resolves.toMatchObject({
    id: message.id,
  });
  expect(customerWork.wakePendingWork).not.toHaveBeenCalled();
  task.assigneeId = randomUUID();
  await expect(service.send(actorId, scope, reply)).rejects.toThrow(
    "CRM task is unavailable",
  );
});

it("authorizes completed task previews and delivered originals within the exact workspace scope", async () => {
  const { service, scope, actorId, task, orderWork, privateFiles, social } =
    conversation("crm-manager");
  const orderId = randomUUID();
  const preview = randomUUID();
  const result = randomUUID();
  const receipt = randomUUID();
  const attachment = {
    id: preview,
    previewFileId: preview,
    previewMimeType: "image/png",
    originalFileId: result,
  };
  const work = {
    orderId,
    storeId: scope.storeId,
    taskId: scope.taskId,
    customerId: task.customerId,
    files: [attachment],
    decisions: [],
    resultFileId: result,
    paid: { fileId: preview },
    receiptFileId: receipt,
    deliveredAt: new Date().toISOString(),
  };
  task.orderId = orderId;
  task.status = "closed";
  task.assigneeId = actorId;
  orderWork.findByOrder.mockResolvedValue(work);
  const file = { id: preview, name: "result.png", mimeType: "image/png" };
  privateFiles.findById.mockResolvedValue(file);

  await expect(service.thread(actorId, scope)).resolves.toMatchObject({
    canSend: true,
    order: {
      orderId,
      files: [
        {
          id: attachment.id,
          preview: { id: preview },
          previewMimeType: "image/png",
        },
      ],
      result: { id: result },
      receipt: null,
    },
  });
  await expect(service.artifact(actorId, scope, preview)).resolves.toBe(file);
  await expect(service.artifact(actorId, scope, result)).resolves.toBe(file);
  const discussion = { ...scope, threadId: randomUUID() };
  social.chatsToCrmModuleTasks.forThread.mockResolvedValue({
    crmModuleTaskId: task.id,
    chatId: scope.chatId,
    threadId: discussion.threadId,
  });
  social.thread.findById.mockResolvedValue({ title: "Доставка" });
  const view = await service.thread(actorId, discussion);
  expect(view.title).toBe("Доставка");
  const previewPath = view.order?.files[0].preview?.path;
  expect(new URLSearchParams(previewPath?.split("?")[1]).get("threadId")).toBe(
    discussion.threadId,
  );
  await expect(service.artifact(actorId, discussion, preview)).resolves.toBe(
    file,
  );
  social.chatsToCrmModuleTasks.forThread.mockResolvedValueOnce({
    crmModuleTaskId: randomUUID(),
    chatId: scope.chatId,
  });
  await expect(service.artifact(actorId, discussion, preview)).rejects.toThrow(
    "task conversation is unavailable",
  );
  await expect(service.artifact(actorId, scope, receipt)).rejects.toThrow(
    "result file is unavailable",
  );
  await expect(
    service.artifact(actorId, { ...scope, chatId: randomUUID() }, preview),
  ).rejects.toThrow("task conversation is unavailable");
  orderWork.findByOrder.mockResolvedValueOnce({
    ...work,
    taskId: randomUUID(),
  });
  await expect(service.artifact(actorId, scope, preview)).rejects.toThrow(
    "result file is unavailable",
  );
  orderWork.findByOrder.mockResolvedValueOnce({ ...work, deliveredAt: null });
  await expect(service.artifact(actorId, scope, result)).rejects.toThrow(
    "result file is unavailable",
  );
  orderWork.findByOrder.mockResolvedValueOnce({ ...work, paid: null });
  await expect(service.artifact(actorId, scope, result)).rejects.toThrow(
    "result file is unavailable",
  );
  expect(privateFiles.findById.mock.calls).toEqual([
    [{ id: preview }],
    [{ id: result }],
    [{ id: preview }],
  ]);
  await expect(
    service.send(actorId, scope, { text: "Reply", operationKey: randomUUID() }),
  ).resolves.toHaveProperty("id");
});
