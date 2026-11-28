import { randomUUID } from "node:crypto";
import { Service } from "./index";

it("refuses new messages in the completed order thread without invoking work", async () => {
  const task = {
    id: randomUUID(),
    storeId: randomUUID(),
    orderId: randomUUID(),
    customerId: randomUUID(),
    status: "closed",
    outcome: "completed",
  };
  const input = {
    customerId: task.customerId,
    chatId: randomUUID(),
    threadId: randomUUID(),
    profileId: randomUUID(),
    sourceSystemId: randomUUID(),
    text: "Спасибо за итоговый бриф.",
    hasAttachments: false,
  };
  const message = {
    id: randomUUID(),
    description: input.text,
    variant: "customer-work",
  };
  const createWorkMessage = jest.fn().mockResolvedValue(message);
  const createPlacement = jest.fn();
  const service = new Service({
    repository: { withSubjectLock: jest.fn(async (_, callback) => callback()) },
    module: {
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([{ variant: "default" }]),
      },
    },
    modules: {
      crm: {
        task: {
          findById: jest.fn().mockResolvedValue(task),
          withTask: jest.fn(async (_, callback) => callback(task)),
        },
      },
      social: {
        chatsToCrmModuleTasks: {
          forThread: jest.fn().mockResolvedValue({ crmModuleTaskId: task.id }),
        },
        profilesToChats: { find: jest.fn().mockResolvedValue([{}]) },
        message: { createWorkMessage },
        profilesToMessages: {
          create: createPlacement,
          find: jest.fn().mockResolvedValue([{ profileId: input.profileId }]),
        },
        threadsToMessages: {
          create: createPlacement,
          find: jest.fn().mockResolvedValue([{}]),
        },
        chatsToMessages: { create: createPlacement },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const internals = service as unknown as {
    channel: () => Promise<{ chatId: string; threadId: string }>;
  };
  jest
    .spyOn(internals, "channel")
    .mockResolvedValue({ chatId: input.chatId, threadId: input.threadId });
  const wake = jest.spyOn(service, "wakePendingWork");

  await expect(service.messageFromThread(input)).rejects.toThrow("read-only");
  expect(createWorkMessage).not.toHaveBeenCalled();
  expect(createPlacement).not.toHaveBeenCalled();
  expect(wake).not.toHaveBeenCalled();
});

function resumptionFixture() {
  const task = {
    id: randomUUID(),
    storeId: randomUUID(),
    stageId: "current",
    publicationId: randomUUID(),
    status: "active",
    assigneeKind: "ai",
    assigneeId: randomUUID(),
    assignmentRevision: 4,
    revision: 10,
    customerId: randomUUID(),
  } as Parameters<Service["resumeAssignedReply"]>[0];
  const message = {
    id: randomUUID(),
    variant: "customer-work",
    description: "",
    metadata: {
      customerWorkAttachments: [
        {
          id: randomUUID(),
          name: "reference.png",
          mimeType: "image/png",
          digest: "a".repeat(64),
        },
      ],
    },
  };
  const source = {
    id: randomUUID(),
    kind: "customer-message",
    taskId: task.id,
    revision: 7,
    detail: { messageId: message.id },
  };
  const resumed = {
    id: randomUUID(),
    kind: "customer-work-resumed",
    taskId: task.id,
    causeId: source.id,
    revision: 11,
    assignmentRevision: task.assignmentRevision,
    detail: {
      messageId: message.id,
      sourceRevision: source.revision,
      stageId: task.stageId,
      publicationId: task.publicationId,
      assigneeId: task.assigneeId,
    },
  };
  const queue = {
    forMessages: jest.fn().mockResolvedValue([source]),
    pendingEvents: jest.fn().mockResolvedValue([resumed]),
    setPending: jest.fn(),
    finishPending: jest.fn(),
  };
  const funnel = jest.fn().mockResolvedValue({
    definition: {
      workFunding: { payer: "store-owner" },
      stages: [{ id: "current", actions: [] }],
    },
  });
  const queueStageEntry = jest.fn().mockResolvedValue({
    task: { ...task, revision: 11 },
    event: { id: randomUUID(), kind: "stage-entry", detail: {} },
  });
  const resumeCustomerWork = jest.fn().mockResolvedValue({
    task: { ...task, revision: resumed.revision },
    event: resumed,
  });
  const findEvent = jest.fn().mockResolvedValue(resumed);
  const current = jest.fn().mockResolvedValue(task);
  const findOrderWork = jest.fn();
  const service = new Service({
    modules: {
      crm: {
        task: {
          getFunnel: funnel,
          queueStageEntry,
          resumeCustomerWork,
          findById: current,
        },
        tasksToStages: {
          ...queue,
          find: jest.fn().mockResolvedValue([source]),
          findById: findEvent,
        },
      },
      ecommerce: { order: { work: { findByOrder: findOrderWork } } },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  jest
    .spyOn(service, "workspaceChannel")
    .mockResolvedValue({ threadId: "thread" } as Awaited<
      ReturnType<Service["workspaceChannel"]>
    >);
  const internals = service as unknown as {
    messages: (threadId: string) => Promise<unknown[]>;
    customerProfiles: () => Promise<Set<string>>;
    knowledge: { expert: () => Promise<{ conflict: boolean }> };
  };
  jest.spyOn(internals, "knowledge", "get").mockReturnValue({
    expert: jest.fn().mockResolvedValue({ conflict: false }),
  });
  jest
    .spyOn(internals, "customerProfiles")
    .mockResolvedValue(new Set(["customer"]));
  const placement = { message, profileId: "customer", linkedAt: new Date(0) };
  const messages = jest
    .spyOn(internals, "messages")
    .mockResolvedValue([placement]);
  return {
    service,
    task,
    message,
    placement,
    source,
    resumed,
    queue,
    queueStageEntry,
    funnel,
    resumeCustomerWork,
    messages,
    current,
    findOrderWork,
  };
}

it("rejects an explicit model override before writing to a fixed stage", async () => {
  const task = {
    id: randomUUID(),
    storeId: randomUUID(),
    stageId: "fixed",
    customerId: randomUUID(),
    status: "active",
  };
  const chatId = randomUUID();
  const threadId = randomUUID();
  const resolveWork = jest.fn();
  const createWorkMessage = jest.fn();
  const service = new Service({
    repository: { withSubjectLock: jest.fn(async (_, callback) => callback()) },
    providerConnections: { resolveWork },
    modules: {
      crm: {
        task: {
          withTask: jest.fn(async (_, callback) => callback(task)),
          getFunnel: jest.fn().mockResolvedValue({
            definition: {
              stages: [
                { id: task.stageId, provider: { modelId: "gpt-6.2-astra" } },
              ],
            },
          }),
        },
        tasksToStages: { byOperation: jest.fn() },
      },
      social: {
        chatsToCrmModuleTasks: {
          channels: jest.fn().mockResolvedValue([{ chatId, threadId }]),
        },
        message: { createWorkMessage },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const internals = service as unknown as {
    checkout: { context: () => Promise<undefined> };
    chatDecision: () => Promise<undefined>;
    recordActivity: (
      customerId: string,
      command: { operation: "message"; operationKey: string; text: string },
      author: {
        profileId: string;
        requestMetadata: { provider: { modelId: string } };
      },
    ) => Promise<unknown>;
  };
  jest
    .spyOn(service, "assignStageEmployee")
    .mockImplementation(async (current) => current);
  jest.spyOn(internals, "checkout", "get").mockReturnValue({
    context: jest.fn().mockResolvedValue(undefined),
  });
  jest.spyOn(internals, "chatDecision").mockResolvedValue(undefined);

  await expect(
    internals.recordActivity(
      task.customerId,
      {
        operation: "message",
        operationKey: "message",
        text: "Check the brief",
      },
      {
        profileId: randomUUID(),
        requestMetadata: { provider: { modelId: "gpt-4o" } },
      },
    ),
  ).rejects.toThrow("This stage has a fixed model");
  expect(resolveWork).not.toHaveBeenCalled();
  expect(createWorkMessage).not.toHaveBeenCalled();
});

it("resumes the latest file-only input by audit order without writing a Social message", async () => {
  const f = resumptionFixture();
  f.messages.mockResolvedValue([
    f.placement,
    {
      ...f.placement,
      message: {
        description: "Earlier answer",
        metadata: { customerWorkPostedRevision: 6 },
        workReplyKey: "attempt:old",
      },
    },
    { ...f.placement, message: { description: "Earlier customer question" } },
  ]);
  await expect(
    f.service.resumeAssignedReply(f.task, "manager"),
  ).resolves.toMatchObject({ revision: 11 });
  expect(f.resumeCustomerWork).toHaveBeenCalledWith({
    storeId: f.task.storeId,
    taskId: f.task.id,
    actorId: "manager",
    causeId: f.source.id,
    assigneeId: f.task.assigneeId,
    expectedRevision: f.task.revision,
    expectedAssignmentRevision: f.task.assignmentRevision,
    operationKey: `resume-work:${f.task.assignmentRevision}:${f.source.id}`,
  });
  expect(f.queue.setPending.mock.calls).toEqual([
    [f.source.id, false],
    [f.resumed.id, true],
  ]);
});

it("starts an assigned order stage without a buyer message", async () => {
  const f = resumptionFixture();
  const start = jest
    .spyOn(
      f.service as unknown as { startReplyAction: () => Promise<void> },
      "startReplyAction",
    )
    .mockResolvedValue();
  const task = { ...f.task, orderId: randomUUID() };
  jest.spyOn(f.service, "wakePendingWork").mockImplementation(() => {});
  await expect(f.service.queueStageEntry(task)).resolves.toMatchObject({
    revision: 11,
  });
  expect(f.queueStageEntry).toHaveBeenCalledWith(task);
  expect(f.service.wakePendingWork).toHaveBeenCalledWith(task.id);
  expect(start).toHaveBeenCalled();
  expect(f.messages).not.toHaveBeenCalled();
  expect(f.resumeCustomerWork).not.toHaveBeenCalled();
});

it.each(["staff reply", "agent reply", "reminder"])(
  "waits after a later %s even when the placement timestamps tie",
  async (kind) => {
    const f = resumptionFixture();
    f.messages.mockResolvedValue([
      {
        ...f.placement,
        profileId: "staff",
        message: {
          id: randomUUID(),
          description: "Reply",
          workReplyKey:
            kind === "reminder"
              ? "reminder:previous"
              : kind === "agent reply"
                ? "attempt:answer"
                : null,
          metadata: { customerWorkPostedRevision: f.source.revision },
        },
      },
      f.placement,
    ]);
    await expect(
      f.service.resumeAssignedReply(f.task, "manager"),
    ).resolves.toBeUndefined();
    expect(f.queue.setPending).not.toHaveBeenCalled();
  },
);

it("leaves an already queued assignment alone and drops a resumed input when the stage changes", async () => {
  const f = resumptionFixture();
  f.queue.forMessages.mockResolvedValue([f.resumed]);
  await expect(
    f.service.resumeAssignedReply(f.task, "manager"),
  ).resolves.toBeUndefined();
  expect(f.resumeCustomerWork).not.toHaveBeenCalled();
  expect(f.queue.setPending).not.toHaveBeenCalled();
  await expect(f.service.listPendingWork()).resolves.toMatchObject([
    { eventId: f.resumed.id, assignmentRevision: f.task.assignmentRevision },
  ]);
  f.current.mockResolvedValue({ ...f.task, stageId: "other" });
  await expect(f.service.listPendingWork()).resolves.toEqual([]);
  expect(f.queue.finishPending).toHaveBeenCalledWith(
    f.resumed.id,
    expect.any(Function),
  );
});

it("does not queue inactive, unfunded or already paid file work", async () => {
  const f = resumptionFixture();
  await expect(
    f.service.resumeAssignedReply({ ...f.task, status: "closed" }, "manager"),
  ).resolves.toBeUndefined();
  await expect(
    f.service.resumeAssignedReply({ ...f.task, status: "waiting" }, "manager"),
  ).resolves.toBeUndefined();
  f.funnel.mockResolvedValueOnce({
    definition: { stages: [{ id: f.task.stageId }] },
  });
  await expect(
    f.service.resumeAssignedReply(f.task, "manager"),
  ).resolves.toBeUndefined();

  f.funnel.mockResolvedValueOnce({
    definition: {
      workFunding: { payer: "store-owner" },
      stages: [{ id: f.task.stageId, output: "image" }],
    },
  });
  const orderId = randomUUID();
  f.findOrderWork.mockResolvedValue({
    kind: "individual-service",
    orderId,
    taskId: f.task.id,
    storeId: f.task.storeId,
    customerId: f.task.customerId,
    paid: { id: randomUUID() },
  });
  await expect(
    f.service.resumeAssignedReply({ ...f.task, orderId }, "manager"),
  ).resolves.toBeUndefined();
  expect(f.findOrderWork).toHaveBeenCalledWith(orderId);
  expect(f.resumeCustomerWork).not.toHaveBeenCalled();
});

it("uses the buyer’s public profile in the exact task conversation", async () => {
  const task = {
    id: "task",
    customerId: "buyer",
    openingKey: "legacy",
  } as Parameters<Service["workspaceCustomerName"]>[0];
  const members = jest.fn().mockResolvedValue([
    { chatId: "chat", profileId: "buyer-in-chat" },
    { chatId: "chat", profileId: "store-agent" },
    { chatId: "other", profileId: "unrelated-buyer-profile" },
  ]);
  const findProfile = jest
    .fn()
    .mockResolvedValue({ variant: "default", title: { ru: "Марина Лапина" } });
  const service = new Service({
    module: {
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            subjectId: "buyer",
            socialModuleProfileId: "unrelated-buyer-profile",
            variant: "default",
          },
          {
            subjectId: "buyer",
            socialModuleProfileId: "buyer-in-chat",
            variant: "telegram",
          },
          {
            subjectId: "agent",
            socialModuleProfileId: "store-agent",
            variant: "default",
          },
        ]),
      },
    },
    modules: {
      social: {
        profilesToChats: { find: members },
        profile: { findById: findProfile },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  await expect(service.workspaceCustomerName(task, "chat")).resolves.toBe(
    "Марина Лапина",
  );
  expect(findProfile).toHaveBeenCalledWith({ id: "buyer-in-chat" });
  members.mockResolvedValueOnce([
    { chatId: "chat", profileId: "buyer-in-chat" },
    { chatId: "chat", profileId: "unrelated-buyer-profile" },
  ]);
  await expect(
    service.workspaceCustomerName(task, "chat"),
  ).resolves.toBeUndefined();
  expect(findProfile).toHaveBeenCalledTimes(1);
});

function ordinaryChat() {
  const profiles = {
    buyer: { id: "buyer", variant: "default" },
    assistant: { id: "assistant", variant: "artificial-intelligence" },
  };
  const resolve = jest.fn().mockResolvedValue({
    id: "consultation",
    revision: 7,
    definition: {
      initialStageId: "answer",
      workFunding: { payer: "store-owner" },
      stages: [{ id: "answer" }],
    },
  });
  const service = new Service({
    findById: jest.fn(async ({ id }) => ({
      id,
      variant: id === "store-agent" ? "agent" : "default",
    })),
    module: {
      subjectsToSocialModuleProfiles: {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "store-agent", variant: "default" },
          ]),
      },
      subjectsToEcommerceModuleStores: {
        find: jest
          .fn()
          .mockResolvedValue([
            { ecommerceModuleStoreId: "store", variant: "crm-agent" },
          ]),
      },
    },
    modules: {
      social: {
        threadsToEcommerceModuleProducts: {
          find: jest.fn().mockResolvedValue([]),
        },
        chat: {
          findById: jest
            .fn()
            .mockResolvedValue({ id: "chat", variant: "default" }),
        },
        chatsToThreads: {
          find: jest
            .fn()
            .mockResolvedValue([{ chatId: "chat", threadId: "thread" }]),
        },
        profilesToChats: {
          find: jest
            .fn()
            .mockResolvedValue([
              { profileId: "buyer" },
              { profileId: "assistant" },
            ]),
        },
        profile: {
          findById: jest.fn(
            async ({ id }: { id: keyof typeof profiles }) => profiles[id],
          ),
        },
      },
      crm: { funnel: { resolve } },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const intake = service as unknown as {
    threadSelection(input: {
      customerId: string;
      chatId: string;
      threadId: string;
      profileId: string;
    }): Promise<unknown>;
  };
  return {
    resolve,
    select: () =>
      intake.threadSelection({
        customerId: "customer",
        chatId: "chat",
        threadId: "thread",
        profileId: "buyer",
      }),
  };
}

it("selects the current consultation funnel for an authorized agent in an ordinary Social chat", async () => {
  const { resolve, select } = ordinaryChat();
  await expect(select()).resolves.toEqual({
    storeId: "store",
    funnelId: "consultation",
    expectedFunnelRevision: 7,
    assigneeId: "store-agent",
  });
  expect(resolve).toHaveBeenCalledWith({
    storeId: "store",
    kind: "consultation",
  });
});

it("does not open an order when the store has no consultation funnel", async () => {
  const { resolve, select } = ordinaryChat();
  resolve.mockResolvedValue(null);
  await expect(select()).resolves.toBeNull();
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(resolve).toHaveBeenCalledWith({
    storeId: "store",
    kind: "consultation",
  });
});

function assignmentFixture() {
  const task = {
    id: "task",
    storeId: "store",
    customerId: "customer",
    stageId: "cover",
    status: "active",
    revision: 7,
    assignmentRevision: 1,
    assigneeId: "assistant",
    assigneeKind: "ai",
    assignmentExpiresAt: null,
  } as Parameters<Service["assignStageEmployee"]>[0];
  const assigned = {
    ...task,
    assignmentRevision: 2,
    assigneeId: "store-agent",
  };
  const stage = {
    id: "cover",
    name: "Cover",
    instruction: "",
    actions: [],
    defaultAssigneeSubjectId: assigned.assigneeId!,
    skillIds: ["selected"],
  };
  const assignment = jest.fn().mockResolvedValue(assigned);
  const events = jest.fn().mockResolvedValue([
    {
      actorId: task.customerId,
      actorKind: "manager",
      operationKey: `assign-assistant:${task.id}`,
    },
  ]);
  const grants = jest.fn().mockResolvedValue([{ variant: "crm-agent" }]);
  const service = new Service({
    findById: jest
      .fn()
      .mockResolvedValue({ id: assigned.assigneeId, variant: "agent" }),
    module: { subjectsToEcommerceModuleStores: { find: grants } },
    modules: {
      crm: { task: { assign: assignment }, tasksToStages: { find: events } },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const ensure = jest
    .spyOn(service, "ensureAssignedAgentInThread")
    .mockResolvedValue(undefined);
  return { service, task, assigned, stage, assignment, events, grants, ensure };
}

it("uses the configured skill stage's agent after the automatic assistant assignment", async () => {
  const { service, task, assigned, stage, assignment, ensure } =
    assignmentFixture();
  const notify = jest.fn().mockResolvedValue(undefined);
  await expect(
    service.assignStageEmployee(task, stage, notify),
  ).resolves.toEqual(assigned);
  expect(assignment).toHaveBeenCalledWith(
    expect.objectContaining({
      expectedRevision: task.revision,
      assigneeId: stage.defaultAssigneeSubjectId,
      assigneeKind: "ai",
    }),
    "system",
  );
  expect(notify.mock.invocationCallOrder[0]).toBeLessThan(
    assignment.mock.invocationCallOrder[0],
  );
  expect(ensure).toHaveBeenCalledWith(assigned);
});

it("uses the configured stage agent when the stage has no selected skills", async () => {
  const { service, task, assigned, stage, ensure } = assignmentFixture();

  await expect(
    service.assignStageEmployee(task, { ...stage, skillIds: [] }),
  ).resolves.toEqual(assigned);
  expect(ensure).toHaveBeenCalledWith(assigned);
});

it("preserves manual assignments, human takeover and an agent outside the store", async () => {
  const { service, task, stage, assignment, events, grants } =
    assignmentFixture();
  const human = { ...task, assigneeKind: "human" as const };
  events.mockResolvedValueOnce([
    { actorId: "manager", actorKind: "manager", operationKey: "takeover" },
  ]);
  await expect(service.assignStageEmployee(human, stage)).resolves.toEqual(
    human,
  );

  events.mockResolvedValueOnce([
    { actorId: "manager", actorKind: "manager", operationKey: "manual" },
  ]);
  await expect(service.assignStageEmployee(task, stage)).resolves.toBe(task);
  expect(grants).not.toHaveBeenCalled();

  grants.mockResolvedValueOnce([]);
  await expect(service.assignStageEmployee(task, stage)).rejects.toThrow(
    "no longer available",
  );
  expect(assignment).not.toHaveBeenCalled();
});

it("assigns the new stage employee when a legacy task enters without an assignee", async () => {
  const { service, task, assigned, stage, events, assignment } =
    assignmentFixture();
  events.mockResolvedValueOnce([]);
  await expect(
    service.assignStageEmployee(
      { ...task, assigneeId: null, assigneeKind: null },
      stage,
    ),
  ).resolves.toEqual(assigned);
  expect(events).toHaveBeenCalledTimes(1);
  expect(assignment).toHaveBeenCalledWith(
    expect.objectContaining({ assigneeId: stage.defaultAssigneeSubjectId }),
    "system",
  );
});

it("assigns the selected destination's employee during an administrative migration", async () => {
  const { service, task, stage, assigned, assignment, events, ensure } =
    assignmentFixture();
  events.mockResolvedValueOnce([]);
  const previous = {
    ...task,
    assigneeKind: "human" as const,
    assigneeId: "manual-assignee",
    assignmentExpiresAt: new Date(0),
  };
  await expect(
    service.assignStageEmployee(previous, stage, undefined, "migration"),
  ).resolves.toEqual(assigned);
  expect(assignment).toHaveBeenCalledWith(
    expect.objectContaining({
      assigneeId: stage.defaultAssigneeSubjectId,
      expectedRevision: previous.revision,
    }),
    "system",
  );
  expect(ensure).toHaveBeenCalledWith(assigned);
});

it("keeps a requested handoff unassigned when a buyer sends another message", async () => {
  const { service, task, stage, events, assignment, ensure } =
    assignmentFixture();
  const pending = {
    ...task,
    assigneeId: null,
    assigneeKind: null,
    assignmentRevision: 3,
  };
  events.mockResolvedValueOnce([{ kind: "customer-handoff-requested" }]);
  await expect(
    service.assignStageEmployee(pending, stage, undefined, false),
  ).resolves.toBe(pending);
  expect(events).toHaveBeenCalledWith({
    params: {
      limit: 1,
      filters: {
        and: [
          { column: "taskId", method: "eq", value: task.id },
          { column: "kind", method: "eq", value: "customer-handoff-requested" },
          {
            column: "assignmentRevision",
            method: "eq",
            value: pending.assignmentRevision,
          },
        ],
      },
    },
  });
  expect(assignment).not.toHaveBeenCalled();
  expect(ensure).not.toHaveBeenCalled();
});

function workspaceOrder() {
  const storeId = "store";
  const orderId = "order";
  const customerId = "customer";
  const actorId = "staff";
  const productId = "product";
  const offerId = "offer";
  const task = { id: "task", orderId, storeId, customerId, productId, offerId };
  const findTasks = jest.fn(async () => [] as (typeof task)[]);
  const findsStores = jest.fn(async () => [{ storeId }]);
  const findOwners = jest.fn(async () => [{ subjectId: customerId }]);
  const service = new Service({
    module: { subjectsToEcommerceModuleOrders: { find: findOwners } },
    modules: {
      ecommerce: {
        order: {
          findById: jest.fn(async () => ({ id: orderId })),
          work: { findByOrder: jest.fn(async () => undefined) },
        },
        storesToOrders: { find: findsStores },
        ordersToProducts: {
          find: jest.fn(async () => [{ productId, offerId }]),
        },
      },
      crm: { task: { find: findTasks, get: jest.fn(async () => task) } },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const open = jest
    .spyOn(
      service as unknown as {
        open: (...args: unknown[]) => Promise<{ taskId: string }>;
      },
      "open",
    )
    .mockResolvedValue({ taskId: task.id });
  return {
    service,
    open,
    findTasks,
    findsStores,
    findOwners,
    task,
    scope: { actorId, storeId, orderId, canManageTasks: true },
  };
}

it("resolves the buyer and offer from the existing order when opening a conversation", async () => {
  const { service, open, task, scope } = workspaceOrder();
  await expect(service.openWorkspaceOrder(scope)).resolves.toEqual(task);
  expect(open).toHaveBeenCalledWith(
    task.customerId,
    {
      operation: "open-cart-discussion",
      storeId: task.storeId,
      orderId: task.orderId,
      productId: task.productId,
      offerId: task.offerId,
      operationKey: expect.any(String),
    },
    undefined,
    scope.actorId,
  );
});

it("opens a closed offer only for the order that already has the exact saved offer", async () => {
  const customerId = randomUUID();
  const productId = randomUUID();
  const storeId = randomUUID();
  const offerId = randomUUID();
  const orderId = randomUUID();
  const task = {
    id: randomUUID(),
    customerId,
    orderId,
    storeId,
    productId,
    offerId,
  };
  const startServiceDiscussion = jest.fn();
  const product = { id: productId, kind: "service", type: "one_off" };
  const offer = {
    id: offerId,
    productId,
    storeId,
    variant: "default",
    settings: {
      standalone: true,
      closedForNewOrders: true,
      requiresResultAcceptance: true,
    },
  };
  const lines = jest
    .fn()
    .mockResolvedValue([{ productId, offerId, quantity: 1 }]);
  const service = new Service({
    findById: jest
      .fn()
      .mockResolvedValue({ id: customerId, variant: "default" }),
    repository: { withSubjectLock: jest.fn(async (_, callback) => callback()) },
    module: {
      subjectsToEcommerceModuleOrders: {
        find: jest.fn().mockResolvedValue([{ subjectId: customerId }]),
      },
    },
    modules: {
      ecommerce: {
        product: { findById: jest.fn().mockResolvedValue(product) },
        storesToProducts: {
          offersForProduct: jest.fn().mockResolvedValue([offer]),
        },
        ordersToProducts: { find: lines },
        storesToOrders: { find: jest.fn().mockResolvedValue([{ storeId }]) },
        order: {
          lockForLifecycle: jest.fn(),
          findById: jest
            .fn()
            .mockResolvedValue({ id: orderId, type: "cart", status: "new" }),
          work: {
            findByOrder: jest.fn().mockResolvedValue({
              kind: "individual-service",
              taskId: task.id,
              customerId,
              storeId,
            }),
            startServiceDiscussion,
          },
          ordersToBillingModulePaymentIntents: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      },
      crm: {
        task: {
          find: jest
            .fn()
            .mockResolvedValueOnce([task])
            .mockResolvedValueOnce([])
            .mockResolvedValue([task]),
        },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const view = jest.spyOn(service, "view").mockResolvedValue({
    taskId: task.id,
    orderId,
  } as Awaited<ReturnType<Service["view"]>>);
  const command = {
    operation: "open-cart-discussion" as const,
    productId,
    orderId,
    storeId,
    offerId,
    operationKey: randomUUID(),
  };
  await expect(service.execute(customerId, command)).resolves.toMatchObject({
    taskId: task.id,
    orderId,
  });
  lines.mockResolvedValueOnce([
    { productId, offerId: randomUUID(), quantity: 1 },
  ]);
  await expect(service.execute(customerId, command)).rejects.toThrow(
    "saved store offer changed",
  );
  expect(view).toHaveBeenCalledTimes(1);
  expect(startServiceDiscussion).toHaveBeenCalledTimes(1);
});

it("returns an already linked task and rejects orders outside the store or manager scope", async () => {
  const { service, open, task, scope, findTasks, findsStores } =
    workspaceOrder();
  findTasks.mockResolvedValueOnce([task]);
  await expect(service.openWorkspaceOrder(scope)).resolves.toEqual(task);
  await expect(
    service.openWorkspaceOrder({ ...scope, canManageTasks: false }),
  ).rejects.toThrow("Order task is unavailable");
  findsStores.mockResolvedValueOnce([{ storeId: "different-store" }]);
  await expect(service.openWorkspaceOrder(scope)).rejects.toThrow(
    "Order is unavailable in this store",
  );
  expect(open).not.toHaveBeenCalled();
});

it("accepts buyer handoffs only while a store manager can take an AI-owned task", async () => {
  const task = {
    id: "task",
    storeId: "store",
    customerId: "buyer",
    status: "active",
    assigneeKind: "ai" as "ai" | "human" | null,
    revision: 7,
  };
  const activity = jest.fn();
  const byOperation = jest.fn();
  const hasHandoffManager = jest.fn().mockResolvedValue(false);
  const service = new Service({
    crmWorkspace: { hasHandoffManager },
    repository: {
      withSubjectLock: async (_scope: unknown, callback: () => unknown) =>
        callback(),
    },
    modules: {
      crm: {
        task: {
          withTask: async (
            _scope: unknown,
            callback: (row: typeof task) => unknown,
          ) => callback(task),
          activity,
        },
        tasksToStages: { byOperation },
      },
      social: {
        chatsToCrmModuleTasks: {
          channels: jest
            .fn()
            .mockResolvedValue([
              { threadId: "thread", chatId: "chat", crmModuleTaskId: task.id },
            ]),
        },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const view = jest
    .spyOn(service, "view")
    .mockResolvedValue({} as Awaited<ReturnType<typeof service.view>>);
  const command = {
    operation: "handoff" as const,
    storeId: task.storeId,
    taskId: task.id,
    operationKey: "handoff-1",
  };

  await expect(service.execute(task.customerId, command)).rejects.toThrow(
    "No store manager is available in this conversation",
  );
  expect(activity).not.toHaveBeenCalled();
  expect(hasHandoffManager).toHaveBeenCalledWith(task.storeId, task.customerId);

  hasHandoffManager.mockResolvedValue(true);
  await expect(service.execute(task.customerId, command)).resolves.toEqual({});
  expect(activity).toHaveBeenCalledWith(
    expect.objectContaining({
      actorId: task.customerId,
      kind: "customer-handoff-requested",
      taskId: task.id,
    }),
  );

  task.assigneeKind = null;
  byOperation.mockResolvedValueOnce({ kind: "customer-handoff-requested" });
  await expect(service.execute(task.customerId, command)).resolves.toEqual({});
  await expect(
    service.execute(task.customerId, {
      ...command,
      operationKey: "handoff-2",
    }),
  ).rejects.toThrow("No store manager is available");
  expect(activity).toHaveBeenCalledTimes(1);
  expect(view).toHaveBeenCalledTimes(2);

  task.assigneeKind = "human";
  await expect(
    service.execute(task.customerId, {
      ...command,
      operationKey: "handoff-3",
    }),
  ).rejects.toThrow("No store manager is available");

  task.assigneeKind = "ai";
  await expect(
    service.execute(task.customerId, {
      ...command,
      operationKey: "handoff-4",
    }),
  ).resolves.toEqual({});
  expect(activity).toHaveBeenCalledTimes(2);
});
