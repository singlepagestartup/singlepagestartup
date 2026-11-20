import { Service } from "./index";

function ordinaryChat() {
  const profiles = {
    buyer: { id: "buyer", variant: "default" },
    assistant: { id: "assistant", variant: "artificial-intelligence" },
  };
  const resolve = jest.fn().mockResolvedValue({
    id: "version",
    funnelId: "consultation",
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

it("selects the published consultation for an authorized agent in an ordinary Social chat", async () => {
  const { resolve, select } = ordinaryChat();
  await expect(select()).resolves.toEqual({
    storeId: "store",
    funnelId: "consultation",
    publicationId: "version",
    assigneeId: "store-agent",
  });
  expect(resolve).toHaveBeenCalledWith({
    storeId: "store",
    kind: "consultation",
  });
});

it("does not open an order when the store has no published consultation", async () => {
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
  } as Parameters<Service["assignStageAgent"]>[0];
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
      crm: { task: { assign: assignment }, taskEvent: { find: events } },
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
  await expect(service.assignStageAgent(task, stage, notify)).resolves.toEqual(
    assigned,
  );
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
    service.assignStageAgent(task, { ...stage, skillIds: [] }),
  ).resolves.toEqual(assigned);
  expect(ensure).toHaveBeenCalledWith(assigned);
});

it("preserves manual assignments, human takeover and an agent outside the store", async () => {
  const { service, task, stage, assignment, events, grants } =
    assignmentFixture();
  const human = { ...task, assigneeKind: "human" as const };
  await expect(service.assignStageAgent(human, stage)).resolves.toEqual(human);
  expect(events).not.toHaveBeenCalled();

  events.mockResolvedValueOnce([
    { actorId: "manager", actorKind: "manager", operationKey: "manual" },
  ]);
  await expect(service.assignStageAgent(task, stage)).resolves.toBe(task);
  expect(grants).not.toHaveBeenCalled();

  grants.mockResolvedValueOnce([]);
  await expect(service.assignStageAgent(task, stage)).resolves.toBe(task);
  expect(assignment).not.toHaveBeenCalled();
});
