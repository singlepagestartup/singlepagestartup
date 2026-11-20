import { Service } from "./training";

const scope = {
  storeId: "store",
  subjectId: "employee",
  profileId: "employee-profile",
  actorProfileId: "trainer-profile",
  chatId: "private-chat",
  threadId: "private-thread",
};

function setup() {
  const messages: Array<{
    id: string;
    description: string;
    sourceSystemId: string;
  }> = [];
  const social = {
    message: {
      find: jest.fn(async ({ params }) =>
        messages.filter(
          ({ sourceSystemId }) =>
            sourceSystemId === params.filters.and[0].value,
        ),
      ),
      createWorkMessage: jest.fn(async (data) => {
        const message = { id: `message-${messages.length + 1}`, ...data };
        messages.push(message);
        return message;
      }),
    },
    profilesToMessages: {
      create: jest.fn(),
      find: jest.fn(async () => [{ id: "author" }]),
    },
    chatsToMessages: { create: jest.fn() },
    threadsToMessages: {
      create: jest.fn(),
      find: jest.fn(async () => [{ id: "placement" }]),
    },
    profilesToKnowledgeModuleSources: {
      create: jest.fn(),
      find: jest.fn(async () => []),
    },
    messagesToKnowledgeModuleSources: { create: jest.fn() },
    threadsToCrmModuleTasks: {
      find: jest.fn(async () => []),
      create: jest.fn(),
    },
    messagesToCrmModuleTaskEvents: { create: jest.fn() },
  };
  const source = {
    upsertSourceBySlug: jest.fn(async () => ({ id: "source" })),
    findSourcesByIds: jest.fn(async () => []),
  };
  const task = {
    id: "task",
    storeId: scope.storeId,
    publicationId: "publication",
    customerId: "owner",
    revision: 1,
  };
  const crm = {
    funnel: {
      trainingBudget: jest.fn(),
    },
    task: {
      openEmployeeTraining: jest.fn(async () => task),
      withTask: jest.fn(async (_scope, callback) => callback(task)),
      assign: jest.fn(async () => ({
        ...task,
        assigneeId: scope.subjectId,
        assigneeKind: "ai",
        revision: 2,
      })),
      activity: jest.fn(async () => ({ event: { id: "event" } })),
    },
  };
  const subject = {
    repository: {
      withSubjectLock: jest.fn(async (_scope, callback) => callback()),
    },
    crmWorkspace: {
      employees: { scopeForChat: jest.fn(async () => scope) },
    },
    modules: { social, knowledge: { source }, crm },
    module: {
      subjectsToEcommerceModuleStores: {
        find: jest.fn(async () => [{ variant: "owner" }]),
      },
    },
    providerConnections: {
      resolve: jest.fn(async () => ({ ownerId: "owner" })),
    },
  };
  const wake = jest.fn();
  const service = new Service(subject as never, wake);
  const request = {
    actorId: "owner",
    actorProfileId: scope.actorProfileId,
    chat: { id: scope.chatId, variant: "store-employee" } as never,
    threadId: scope.threadId,
    sourceSystemId: "request-key",
    hasAttachments: false,
  };
  return { subject, service, social, source, crm, request, messages, wake };
}

describe("Store employee training", () => {
  it("saves an explicit command once and links its source to the employee and origin message", async () => {
    const { service, social, source, crm, request, messages } = setup();
    const input = {
      ...request,
      text: "Запомни, что доставка занимает три дня.",
    };
    const message = await service.send(input);
    await expect(service.send(input)).resolves.toEqual(message);
    await expect(
      service.send({ ...input, text: "Запомни другой срок." }),
    ).rejects.toThrow("request key belongs to another message");
    expect(source.upsertSourceBySlug).toHaveBeenCalledTimes(1);
    expect(source.upsertSourceBySlug).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "доставка занимает три дня.",
        variant: "default",
      }),
    );
    expect(social.profilesToKnowledgeModuleSources.create).toHaveBeenCalledWith(
      {
        data: {
          profileId: scope.profileId,
          storeId: scope.storeId,
          knowledgeModuleSourceId: "source",
          variant: "default",
        },
      },
    );
    expect(social.messagesToKnowledgeModuleSources.create).toHaveBeenCalledWith(
      {
        data: {
          messageId: message.id,
          knowledgeModuleSourceId: "source",
          kind: "origin",
        },
      },
    );
    expect(messages.map(({ description }) => description)).toEqual([
      input.text,
      "Сохранил в свои знания.",
    ]);
    expect(crm.funnel.trainingBudget).not.toHaveBeenCalled();
  });

  it("rejects sends from a different profile before writing a message or knowledge", async () => {
    const { service, request, source, messages } = setup();
    await expect(
      service.send({
        ...request,
        actorProfileId: "customer",
        text: "Запомни чужой текст.",
      }),
    ).rejects.toThrow("Employee training profile is unavailable");
    expect(messages).toHaveLength(0);
    expect(source.upsertSourceBySlug).not.toHaveBeenCalled();
  });

  it("queues an ordinary question in the private conversation with the published marketplace budget", async () => {
    const { service, subject, social, source, crm, request, wake } = setup();
    crm.funnel.trainingBudget.mockResolvedValue({
      id: "publication",
      funnelId: "marketplace-funnel",
      kind: "individual-service",
    });
    const selection = { modelId: "openai/gpt-5.4", reasoning: "high" } as const;
    await service.send({
      ...request,
      text: "Что ты знаешь о доставке?",
      selection,
    });
    expect(source.upsertSourceBySlug).not.toHaveBeenCalled();
    expect(subject.providerConnections.resolve).toHaveBeenCalledWith(
      scope.storeId,
      scope.subjectId,
      "text",
      selection,
    );
    expect(crm.task.openEmployeeTraining).toHaveBeenCalledWith({
      storeId: scope.storeId,
      funnelId: "marketplace-funnel",
      expectedPublicationId: "publication",
      customerId: "owner",
      actorId: "owner",
      operationKey: "store-employee-training:private-thread:publication",
    });
    expect(social.messagesToCrmModuleTaskEvents.create).toHaveBeenCalledWith({
      data: {
        messageId: "message-1",
        crmModuleTaskEventId: "event",
        pending: true,
      },
    });
    expect(wake).toHaveBeenCalledWith("task");
  });
});
