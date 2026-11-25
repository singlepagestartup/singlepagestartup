import { createHash, randomUUID } from "node:crypto";
import { Service as KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Service as ProfileSources } from "../../social-module/profile/knowledge/sources";
import {
  Service,
  employeeTrainingNote,
  refersToTrainingImage,
} from "./training";

jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  Service: jest.fn(),
}));

const scope = {
  storeId: "store",
  subjectId: "employee",
  profileId: "employee-profile",
  actorProfileId: "trainer-profile",
  chatId: "private-chat",
  threadId: randomUUID(),
};

function setup() {
  let withinTransaction = false;
  const profileLinks: Array<{ knowledgeModuleSourceId: string }> = [];
  const originLinks: Array<{ knowledgeModuleSourceId: string }> = [];
  const messages: Array<{
    id: string;
    description: string;
    sourceSystemId: string;
  }> = [];
  const social = {
    message: {
      find: jest.fn(async ({ params }) =>
        messages.filter(({ sourceSystemId }) =>
          params.filters.and[0].method === "inArray"
            ? params.filters.and[0].value.includes(sourceSystemId)
            : sourceSystemId === params.filters.and[0].value,
        ),
      ),
      createWorkMessage: jest.fn(async (data) => {
        const message = {
          id: `message-${messages.length + 1}`,
          variant: "customer-work",
          ...data,
        };
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
      create: jest.fn(async ({ data }) => {
        profileLinks.push(data);
      }),
      find: jest.fn(async () => profileLinks),
    },
    messagesToKnowledgeModuleSources: {
      create: jest.fn(async ({ data }) => {
        originLinks.push(data);
      }),
      find: jest.fn(async () => originLinks),
    },
    chatsToCrmModuleTasks: {
      forThread: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  social.chatsToCrmModuleTasks.forThread.mockResolvedValue(undefined);
  const stored = {
    id: "source",
    content: "",
    title: "",
    variant: "default",
    contentHash: "current",
    indexedContentHash: null as string | null,
  };
  const source = {
    attachPrivateImage: jest.fn(),
    upsertSourceBySlug: jest.fn(async (input) => {
      expect(withinTransaction).toBe(true);
      if (!stored.content) {
        Object.assign(stored, input);
      }
      return stored;
    }),
    findById: jest.fn(async () => stored),
    lock: jest.fn(async () => [stored]),
    findSourcesByIds: jest.fn().mockResolvedValue([]),
  };
  const indexAuthorizedSource = jest.fn(async () => {
    expect(withinTransaction).toBe(true);
    expect(profileLinks).toHaveLength(1);
    stored.indexedContentHash = stored.contentHash;
  });
  const searchAuthorizedSources = jest.fn().mockResolvedValue([]);
  jest
    .mocked(KnowledgeService)
    .mockImplementation(
      () => ({ indexAuthorizedSource, searchAuthorizedSources }) as never,
    );
  const task = {
    id: "task",
    storeId: scope.storeId,
    publicationId: "publication",
    funnelId: "marketplace-funnel",
    openingKey: `store-employee-training:${scope.threadId}:publication`,
    customerId: "owner",
    revision: 1,
  };
  const crm = {
    tasksToStages: { setPending: jest.fn() },
    funnel: {
      trainingBudget: jest.fn(),
    },
    task: {
      get: jest.fn(async () => task),
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
  const writeOpaque = jest.fn(async ({ name, bytes }) => {
    expect(withinTransaction).toBe(true);
    return {
      id: randomUUID(),
      name,
      digest: createHash("sha256").update(bytes).digest("hex"),
      size: bytes.length,
    };
  });
  const subject = {
    repository: {
      withSubjectLock: jest.fn(async (_scope, callback) => {
        withinTransaction = true;
        const snapshot = { ...stored };
        const counts = [
          messages.length,
          profileLinks.length,
          originLinks.length,
        ];
        try {
          return await callback();
        } catch (error) {
          Object.assign(stored, snapshot);
          messages.length = counts[0];
          profileLinks.length = counts[1];
          originLinks.length = counts[2];
          throw error;
        } finally {
          withinTransaction = false;
        }
      }),
    },
    customerWork: { priorEmployeeImage: jest.fn() },
    crmWorkspace: {
      employees: { scopeForChat: jest.fn(async () => scope) },
    },
    modules: {
      social,
      knowledge: { source },
      crm,
      fileStorage: {
        file: { privateContent: { writeOpaque } },
      },
    },
    module: {
      subjectsToEcommerceModuleStores: {
        find: jest.fn(async () => [{ variant: "owner" }]),
      },
    },
    providerConnections: {
      resolveWork: jest.fn(async () => ({ ownerId: "owner" })),
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
    attachments: [],
  };
  return {
    subject,
    service,
    social,
    source,
    crm,
    request,
    messages,
    wake,
    indexAuthorizedSource,
    searchAuthorizedSources,
    writeOpaque,
  };
}

describe("Store employee training", () => {
  it("saves file-only messages in order and rejects changed files on retry", async () => {
    const { service, request, writeOpaque, source, social, crm, wake } =
      setup();
    const input = {
      ...request,
      text: "",
      attachments: [
        new File(["first"], "notes.txt"),
        new File(["second"], "outline.md"),
      ],
    };
    const message = await service.send(input);
    expect(message).toMatchObject({
      description: "",
      metadata: {
        customerWorkAttachments: [
          { name: "notes.txt", size: 5 },
          { name: "outline.md", size: 6 },
        ],
      },
    });
    await expect(service.send(input)).resolves.toEqual(message);
    await expect(
      service.send({
        ...input,
        attachments: [...input.attachments].reverse(),
      }),
    ).rejects.toThrow("request key belongs to another message");
    await expect(
      service.send({
        ...input,
        attachments: [new File(["other"], "notes.txt"), input.attachments[1]],
      }),
    ).rejects.toThrow("request key belongs to another message");
    expect(writeOpaque).toHaveBeenCalledTimes(2);
    expect(social.message.createWorkMessage).toHaveBeenCalledTimes(1);
    expect(source.upsertSourceBySlug).not.toHaveBeenCalled();
    expect(crm.funnel.trainingBudget).not.toHaveBeenCalled();
    expect(wake).not.toHaveBeenCalled();
  });

  it("saves an explicit command once and links its source to the employee and origin message", async () => {
    const {
      service,
      social,
      source,
      crm,
      request,
      messages,
      indexAuthorizedSource,
    } = setup();
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
      true,
    );
    expect(social.profilesToKnowledgeModuleSources.create).toHaveBeenCalledWith(
      {
        data: {
          profileId: scope.profileId,
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
      "Заметка сохранена и доступна для поиска.",
    ]);
    expect(crm.funnel.trainingBudget).not.toHaveBeenCalled();
    expect(indexAuthorizedSource).toHaveBeenCalledTimes(1);
    expect(indexAuthorizedSource).toHaveBeenCalledWith({ sourceId: "source" });
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

  it("links the reviewed image from this thread once and preserves the approved note", async () => {
    const { service, subject, request, source, indexAuthorizedSource } =
      setup();
    const image = { id: randomUUID(), digest: "verified-image" };
    subject.customerWork.priorEmployeeImage.mockResolvedValue(image);
    const input = {
      ...request,
      text: `Запомни с изображением: Свет

## Композиция
Светлый фон.`,
    };
    await service.send(input);
    await service.send(input);
    expect(subject.customerWork.priorEmployeeImage).toHaveBeenCalledWith(
      scope,
      "присланное изображение",
    );
    expect(source.attachPrivateImage).toHaveBeenCalledTimes(1);
    expect(source.attachPrivateImage).toHaveBeenCalledWith("source", image);
    expect(indexAuthorizedSource).toHaveBeenCalledTimes(1);
  });

  it("rolls back the training note and its chat messages on indexing failure, then retries once", async () => {
    const {
      service,
      social,
      source,
      request,
      messages,
      indexAuthorizedSource,
    } = setup();
    indexAuthorizedSource.mockRejectedValueOnce(new Error("Provider failed"));
    const input = { ...request, text: "Запомни доставка три дня." };
    expect(employeeTrainingNote(input.text)).toBe("доставка три дня.");
    await expect(service.send(input)).rejects.toThrow("Provider failed");
    expect(messages).toHaveLength(0);
    const message = await service.send(input);
    await expect(service.send(input)).resolves.toEqual(message);
    expect(messages.at(-1)?.description).toBe(
      "Заметка сохранена и доступна для поиска.",
    );
    expect(messages).toHaveLength(2);
    expect(source.upsertSourceBySlug).toHaveBeenCalledTimes(2);
    expect(
      social.messagesToKnowledgeModuleSources.create,
    ).toHaveBeenCalledTimes(2);
    expect(indexAuthorizedSource).toHaveBeenCalledTimes(2);
  });

  it("keeps named sidebar creates idempotent through the same save and index path", async () => {
    const { subject, social, indexAuthorizedSource } = setup();
    const service = new ProfileSources(subject as never);
    const input = {
      slug: "operation",
      profileId: scope.profileId,
      storeId: scope.storeId,
      title: "Title",
      content: "Fact",
    };
    indexAuthorizedSource.mockRejectedValueOnce(new Error("Provider failed"));
    await expect(service.create("owner", input)).rejects.toThrow(
      "Provider failed",
    );
    await expect(service.create("owner", input)).resolves.toMatchObject({
      source: { id: "source", indexedContentHash: "current" },
    });
    await expect(
      service.create("owner", { ...input, content: "Different" }),
    ).rejects.toThrow("another Knowledge Source");
    expect(
      social.profilesToKnowledgeModuleSources.create,
    ).toHaveBeenCalledTimes(2);
    expect(
      social.messagesToKnowledgeModuleSources.create,
    ).not.toHaveBeenCalled();
  });

  it("repairs a previously saved pending chat note and confirms its existing origin only once", async () => {
    const {
      service,
      request,
      source,
      social,
      messages,
      indexAuthorizedSource,
    } = setup();
    const input = { ...request, text: "Remember our delivery terms." };
    const original = await service.send(input);
    const previous = messages.at(-1)!;
    previous.sourceSystemId = previous.sourceSystemId.replace(
      /:indexed$/,
      ":pending",
    );
    previous.description = "The note was saved. It is not searchable yet.";
    const stored = await source.findById();
    stored.indexedContentHash = null;
    indexAuthorizedSource.mockRejectedValueOnce(new Error("Provider failed"));
    await expect(service.send(input)).rejects.toThrow("Provider failed");
    expect(messages).toHaveLength(2);
    await expect(service.send(input)).resolves.toEqual(original);
    await expect(service.send(input)).resolves.toEqual(original);
    expect(messages).toHaveLength(3);
    expect(messages.at(-1)?.sourceSystemId).toMatch(/:indexed$/);
    expect(source.upsertSourceBySlug).toHaveBeenCalledTimes(1);
    expect(
      social.messagesToKnowledgeModuleSources.create,
    ).toHaveBeenCalledTimes(1);
  });

  it("queries only authorized employee and manager sources and accepts current chunk versions", async () => {
    const { service, social, source, searchAuthorizedSources } = setup();
    const link = (
      knowledgeModuleSourceId: string,
      profileId: string,
      fields: object = {},
    ) => ({
      knowledgeModuleSourceId,
      profileId,
      storeId: scope.storeId,
      variant: "default",
      ...fields,
    });
    social.profilesToKnowledgeModuleSources.find.mockResolvedValue([
      link("employee", scope.profileId),
      link("manager", scope.actorProfileId, { storeId: null }),
      link("manager-note", scope.actorProfileId, {
        variant: "customer-memory",
      }),
      link("profile-note", scope.actorProfileId, {
        storeId: null,
        variant: "customer-memory",
      }),
      link("employee-private", scope.profileId, {
        storeId: null,
        variant: "customer-memory",
      }),
      link("wrong-store", scope.actorProfileId, { storeId: "another" }),
      link("wrong-project", scope.actorProfileId, { projectId: "project" }),
      link("wrong-offer", scope.profileId, { offerId: "offer" }),
      link("wrong-profile", "other-profile"),
    ]);
    source.findSourcesByIds.mockResolvedValue([
      {
        id: "employee",
        contentHash: "v1",
        variant: "default",
        content: "Unused raw content",
      },
      { id: "manager", contentHash: "v2", variant: "default" },
      { id: "manager-note", contentHash: "v3", variant: "customer-memory" },
      { id: "profile-note", contentHash: "v4", variant: "customer-memory" },
    ]);
    const knowledge = await service.knowledgeScope(scope);
    expect(source.findSourcesByIds).toHaveBeenCalledWith([
      "employee",
      "manager",
      "manager-note",
      "profile-note",
    ]);
    expect(knowledge.personalKnowledgeSourceIds).toEqual([
      "manager",
      "manager-note",
      "profile-note",
    ]);
    expect(searchAuthorizedSources).not.toHaveBeenCalled();
    searchAuthorizedSources.mockResolvedValue([
      {
        sourceId: "employee",
        sourceVersion: "v1",
        sourceTitle: "Policy",
        text: "Relevant passage",
      },
      { sourceId: "manager", sourceVersion: "stale", text: "Stale passage" },
      { sourceId: "manager-note", text: "Version missing" },
      {
        sourceId: "profile-note",
        sourceVersion: "v4",
        sourceTitle: "Design",
        text: "Use cobalt blue.",
      },
      { sourceId: "wrong-profile", sourceVersion: "v1", text: "Outside scope" },
    ]);
    await expect(
      service.references(knowledge, "How long is delivery?"),
    ).resolves.toEqual([
      { id: "employee", version: "v1", text: "### Policy\n\nRelevant passage" },
      {
        id: "profile-note",
        version: "v4",
        text: "### Design\n\nUse cobalt blue.",
      },
    ]);
    expect(searchAuthorizedSources).toHaveBeenCalledTimes(1);
    expect(searchAuthorizedSources).toHaveBeenCalledWith({
      sourceIds: ["employee", "manager", "manager-note", "profile-note"],
      personalSourceIds: ["manager", "manager-note", "profile-note"],
      query: "How long is delivery?",
      topK: 4,
      finalTopK: 4,
    });
  });

  it("explains unavailable AI replies without reading notes when there is no store budget", async () => {
    const { service, source, request, messages, searchAuthorizedSources } =
      setup();
    await service.send({
      ...request,
      text: "What do you know about delivery?",
    });
    expect(messages.at(-1)?.description).toContain(
      "configured store-owner budget",
    );
    expect(source.findSourcesByIds).not.toHaveBeenCalled();
    expect(searchAuthorizedSources).not.toHaveBeenCalled();
  });

  it("queues an ordinary question in the private conversation with the current marketplace budget", async () => {
    const { service, subject, social, source, crm, request, wake } = setup();
    crm.funnel.trainingBudget.mockResolvedValue({
      id: "marketplace-funnel",
      revision: 7,
      kind: "individual-service",
    });
    const selection = {
      modelId: "gpt-5.4-mini-2026-03-17",
      reasoning: "high",
    } as const;
    await service.send({
      ...request,
      text: "Что ты знаешь о доставке?",
      selection,
    });
    expect(source.upsertSourceBySlug).not.toHaveBeenCalled();
    expect(subject.providerConnections.resolveWork).toHaveBeenCalledWith(
      scope.storeId,
      scope.subjectId,
      "text",
      { payer: "store-owner", preferredOwnerId: "owner" },
      selection,
    );
    expect(crm.task.openEmployeeTraining).toHaveBeenCalledWith({
      storeId: scope.storeId,
      funnelId: "marketplace-funnel",
      expectedFunnelRevision: 7,
      customerId: "owner",
      actorId: "owner",
      operationKey: `store-employee-training:${scope.threadId}:marketplace-funnel`,
    });
    expect(crm.tasksToStages.setPending).toHaveBeenCalledWith("event", true);
    expect(wake).toHaveBeenCalledWith("task");
  });

  it("reuses the private training task when its funnel budget changes", async () => {
    const { service, social, crm, request } = setup();
    crm.funnel.trainingBudget.mockResolvedValue({
      id: "marketplace-funnel",
      revision: 8,
      kind: "individual-service",
    });
    social.chatsToCrmModuleTasks.forThread.mockResolvedValue({
      id: "link",
      crmModuleTaskId: "task",
    });

    await service.send({
      ...request,
      text: "What do you know about delivery?",
    });

    expect(crm.task.openEmployeeTraining).not.toHaveBeenCalled();
    expect(social.chatsToCrmModuleTasks.update).not.toHaveBeenCalled();
    expect(crm.task.activity).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: "task", kind: "customer-message" }),
    );
  });

  it("rejects a task linked from a sibling employee thread", async () => {
    const { service, social, crm, request } = setup();
    crm.funnel.trainingBudget.mockResolvedValue({
      id: "marketplace-funnel",
      revision: 8,
    });
    social.chatsToCrmModuleTasks.forThread.mockResolvedValue({
      id: "link",
      crmModuleTaskId: "task",
    });
    const task = await crm.task.get();
    crm.task.get.mockResolvedValue({
      ...task,
      openingKey: `store-employee-training:${randomUUID()}:${task.funnelId}`,
    });
    await expect(
      service.send({ ...request, text: "Что сейчас обсуждаем?" }),
    ).rejects.toThrow("another conversation");
    expect(crm.task.activity).not.toHaveBeenCalled();
  });
});

it.each([
  ["Что изображено на обложке?", false, true],
  ["Как тебе?", true, true],
  ["Что изображено?", true, true],
  ["Что там?", false, false],
  ["Describe the cover I uploaded", false, true],
  ["Сколько стоит разработка обложки?", false, false],
  ["Сколько дней занимает доставка?", true, false],
])(
  "selects earlier pictures for visual questions: %s",
  (question, followsUpload, expected) => {
    expect(
      refersToTrainingImage(String(question), followsUpload === true),
    ).toBe(expected);
  },
);
