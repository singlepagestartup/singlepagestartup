import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import {
  customerWorkInputText,
  isMemoryOnlyMessage,
  isPersonalMemoryCommand,
  Service,
  StageSkillsUnavailable,
} from "./knowledge";

const mockSearch = jest.fn();
const mockIndex = jest.fn();
jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  KnowledgeService: jest.fn(() => ({
    searchAuthorizedSources: mockSearch,
    indexAuthorizedSource: mockIndex,
  })),
}));

interface ISourceLink {
  profileId: string;
  knowledgeModuleSourceId: string;
  variant: string;
  storeId: string | null;
  projectId: string | null;
  offerId?: string;
}

function fixture() {
  const publicSource = {
    id: "specification",
    variant: "default",
    title: "Phone",
    content: "The current battery is 4,000 mAh.",
    contentHash: "version-a",
    updatedAt: new Date(),
    slug: "product-reference",
  };
  const privateSource = (id: string, content: string) => ({
    id,
    variant: "customer-memory",
    title: "Personal note",
    content,
    contentHash: id,
    updatedAt: new Date(),
    slug: id,
  });
  const docs = [
    publicSource,
    privateSource("same-brand", "Use formal address for North."),
    privateSource("other-brand", "Use informal address for South."),
    privateSource("other-store", "Another shop’s private information."),
    privateSource("other-customer", "Another buyer’s private information."),
  ];
  const sourceLinks: ISourceLink[] = [
    {
      profileId: "assigned-profile",
      knowledgeModuleSourceId: publicSource.id,
      variant: "product-specification",
      storeId: "store-1",
      projectId: null,
      offerId: "offer-1",
    },
    {
      profileId: "expert",
      knowledgeModuleSourceId: "other-customer",
      variant: "default",
      storeId: null,
      projectId: null,
    },
    {
      profileId: "buyer-profile",
      knowledgeModuleSourceId: "same-brand",
      variant: "customer-memory",
      storeId: "store-1",
      projectId: null,
    },
    {
      profileId: "buyer-profile",
      knowledgeModuleSourceId: "other-brand",
      variant: "customer-memory",
      storeId: "store-1",
      projectId: "south",
    },
    {
      profileId: "buyer-profile",
      knowledgeModuleSourceId: "other-store",
      variant: "customer-memory",
      storeId: "store-2",
      projectId: "north",
    },
    {
      profileId: "other-profile",
      knowledgeModuleSourceId: "other-customer",
      variant: "customer-memory",
      storeId: "store-1",
      projectId: "north",
    },
  ];
  const resolveStoreExpert = jest
    .fn<Promise<{ conflict: boolean; profileId?: string }>, [unknown]>()
    .mockResolvedValue({ conflict: false, profileId: "expert" });
  const find =
    <Row extends object>(rows: Row[]) =>
    async ({
      params,
    }: {
      params: { filters: { and: { column: string; value: string }[] } };
    }) =>
      rows.filter((row) =>
        params.filters.and.every(
          ({ column, value }) => row[column as keyof Row] === value,
        ),
      );
  const source = {
    findSourcesByIds: jest.fn(async (ids: string[]) =>
      docs.filter(({ id }) => ids.includes(id)),
    ),
    updateSource: jest.fn(),
    upsertSourceBySlug: jest.fn(),
    lock: jest.fn(),
  };
  const search = async ({ sourceIds }: { sourceIds: string[] }) =>
    sourceIds.flatMap((id) => {
      const doc = docs.find(({ id: docId }) => docId === id);
      return doc
        ? [{ sourceId: id, sourceVersion: doc.contentHash, text: doc.content }]
        : [];
    });
  mockSearch.mockReset().mockImplementation(search);
  mockIndex.mockReset().mockResolvedValue(undefined);
  const linkSource = jest.fn(async ({ data }: { data: ISourceLink }) => {
    sourceLinks.push(data);
  });
  const authenticate = jest.fn().mockResolvedValue({ authenticated: true });
  const skills = [
    {
      id: "selected",
      profileId: "assigned-profile",
      title: "Studio styling",
      description: "Use an embossed linen texture.",
    },
    {
      id: "unused",
      profileId: "assigned-profile",
      title: "Other styling",
      description: "Use a concrete texture.",
    },
    {
      id: "foreign",
      profileId: "expert",
      title: "Expert styling",
      description: "Use a ceramic texture.",
    },
  ];
  const linkedSkills = jest.fn(async (profileId: string, ids: string[]) =>
    skills.filter(
      (skill) => skill.profileId === profileId && ids.includes(skill.id),
    ),
  );
  const skillSources: { skillId: string; knowledgeModuleSourceId: string }[] =
    [];
  const skillSourceFind = jest.fn(
    async ({
      params,
    }: {
      params: { filters: { and: [{ value: string }, { value: string[] }] } };
    }) =>
      skillSources.filter(({ knowledgeModuleSourceId }) =>
        params.filters.and[1].value.includes(knowledgeModuleSourceId),
      ),
  );
  const trainingOrigins = jest.fn();
  const expertDescription =
    "Offer-specific guidance. ".repeat(600) + "END OF EXPERT ROLE";
  const subject = {
    authenticationMe: authenticate,
    modules: {
      social: {
        profilesToEcommerceModuleProducts: { resolveStoreExpert },
        profile: {
          findById: async () => ({
            id: "expert",
            variant: "artificial-intelligence",
            description: { en: expertDescription },
          }),
        },
        profilesToKnowledgeModuleSources: {
          find: find(sourceLinks),
          create: linkSource,
        },
        profilesToSkills: { linkedSkills },
        messagesToKnowledgeModuleSources: { find: trainingOrigins },
        skillsToKnowledgeModuleSources: { find: skillSourceFind },
      },
      knowledge: { source },
      ecommerce: {
        product: {
          findById: async () => ({
            id: "phone",
            title: { en: "Phone Model 4" },
          }),
        },
        storesToProducts: {
          findById: async () => ({
            id: "offer-1",
            productId: "phone",
            storeId: "store-1",
          }),
        },
        categoriesToProducts: { find: async () => [] },
      },
    },
  };
  const task = {
    customerId: "buyer",
    storeId: "store-1",
    offerId: "offer-1",
    productId: "phone",
  } as Task;
  const scope = {
    customerId: "buyer",
    profileId: "buyer-profile",
    storeId: "store-1",
  };
  const service = new Service(
    subject as unknown as ConstructorParameters<typeof Service>[0],
  );
  return {
    service,
    task,
    scope,
    source,
    publicSource,
    docs,
    sourceLinks,
    linkedSkills,
    skillSources,
    resolveStoreExpert,
    expertDescription,
    trainingOrigins,
    authenticate,
    linkSource,
  };
}

afterEach(() => jest.restoreAllMocks());

it("reads employee training knowledge for its store and reflects edits or deletion", async () => {
  const { service, task, sourceLinks, docs } = fixture();
  const taught = {
    id: "employee-source",
    slug: "employee-source",
    variant: "default",
    title: "Delivery",
    content: "Delivery takes three days.",
    contentHash: "first-version",
    updatedAt: new Date(),
  };
  docs.push(taught);
  sourceLinks.push({
    knowledgeModuleSourceId: taught.id,
    profileId: "employee-profile",
    variant: "default",
    storeId: task.storeId,
    projectId: null,
  });
  const scope = { agentProfileId: "employee-profile" };
  const question = "How long does delivery take?";
  const initial = await service.context(task, scope, question);
  expect(initial.content).toContain("Delivery takes three days.");
  expect(initial.sourceVersions).toContainEqual({
    id: taught.id,
    version: "first-version",
  });
  const elsewhere = await service.context(
    { ...task, storeId: "another" },
    scope,
    question,
  );
  expect(elsewhere.content).not.toContain("Delivery takes three days.");
  taught.content = "Delivery takes four days.";
  taught.contentHash = "second-version";
  const edited = await service.context(task, scope, question);
  expect(edited.content).toContain("Delivery takes four days.");
  expect(edited.sourceVersions).toContainEqual({
    id: taught.id,
    version: "second-version",
  });
  docs.splice(docs.indexOf(taught), 1);
  const removed = await service.context(task, scope, question);
  expect(removed.knowledgeSourceIds).not.toContain(taught.id);
});

it("uses only the skills selected for the current assignment and keeps attached source text out of image guidance", async () => {
  const { service, task, sourceLinks, docs, linkedSkills, skillSources } =
    fixture();
  const assignment = {
    ...task,
    assigneeKind: "ai" as const,
    assigneeId: "assigned-agent",
  };
  const profile = { agentProfileId: "assigned-profile" };
  const stage = {
    name: "Cover",
    defaultAssigneeSubjectId: assignment.assigneeId,
    skillIds: ["selected"],
  };
  for (const [id, skillId, profileId] of [
    ["selected-source", "selected", "assigned-profile"],
    ["unused-source", "unused", "assigned-profile"],
    ["foreign-source", "selected", "expert"],
    ["sender-document", "foreign", "sender-profile"],
  ]) {
    docs.push({
      id,
      slug: id,
      variant: "default",
      title: id,
      content: `${id} belongs to its own scope`,
      contentHash: id,
      updatedAt: new Date(),
    });
    sourceLinks.push({
      profileId,
      knowledgeModuleSourceId: id,
      variant: "default",
      storeId: task.storeId,
      projectId: null,
    });
    skillSources.push({ skillId, knowledgeModuleSourceId: id });
  }
  const profiles = { ...profile, senderProfileId: "sender-profile" };
  const scoped = await service.context(
    assignment,
    { ...profiles, stage },
    "cover styling",
  );
  expect(linkedSkills).toHaveBeenCalledWith("assigned-profile", ["selected"]);
  expect(scoped.skillGuidance).toBe(
    "Studio styling\nUse an embossed linen texture.",
  );
  expect(scoped.skillTitles).toEqual(["Studio styling"]);
  expect(scoped.content).toContain("selected-source");
  expect(scoped.content).toContain("sender-document");
  expect(scoped.content).not.toMatch(/unused-source|foreign-source/);

  const image = await service.context(
    assignment,
    { ...profiles, stage: { ...stage, output: "image" } },
    "cover styling",
  );
  expect(image.skillGuidance).toBe(scoped.skillGuidance);
  expect(image.content).not.toContain("selected-source");

  linkedSkills.mockClear();
  const unconfigured = await service.context(
    assignment,
    profiles,
    "cover styling",
  );
  expect(unconfigured.skillGuidance).toBeUndefined();
  expect(unconfigured.content).toContain("sender-document");
  expect(unconfigured.content).not.toMatch(
    /selected-source|unused-source|foreign-source/,
  );
  expect(linkedSkills).not.toHaveBeenCalled();

  await expect(
    service.context(
      assignment,
      { ...profiles, stage: { ...stage, skillIds: ["selected", "foreign"] } },
      "cover styling",
    ),
  ).rejects.toBeInstanceOf(StageSkillsUnavailable);
  await expect(
    service.context(
      { ...assignment, assigneeId: "replacement-agent" },
      { ...profiles, agentProfileId: "replacement-profile", stage },
      "cover styling",
    ),
  ).rejects.toBeInstanceOf(StageSkillsUnavailable);
});

it("uses the actual assignee’s authorized source and the buyer’s selected store and brand memory", async () => {
  const { service, task, scope, publicSource, source, resolveStoreExpert } =
    fixture();
  const original = await service.context(
    task,
    { agentProfileId: "assigned-profile", memory: scope },
    "How large is the battery?",
  );
  expect(original.content).toContain("4,000 mAh");
  expect(original.content).toContain("Use formal address for North");
  expect(original.content).not.toMatch(/South|Another shop|Another buyer/);
  expect(source.findSourcesByIds).toHaveBeenCalledWith([
    "specification",
    "same-brand",
  ]);
  expect(resolveStoreExpert).not.toHaveBeenCalled();
  expect(original.knowledgeSourceIds).toEqual(["specification", "same-brand"]);
  expect(original.personalKnowledgeSourceIds).toEqual(["same-brand"]);
  expect(original.content).toContain("Interlocutor preference");
  expect(original.content).toContain("Store reference");
  expect(original.sourceVersions).toEqual([
    { id: "specification", version: "version-a" },
    { id: "same-brand", version: "same-brand" },
  ]);

  publicSource.content = "The current battery is 4,500 mAh.";
  publicSource.contentHash = "version-b";
  const updated = await service.context(
    task,
    { agentProfileId: "assigned-profile", memory: scope },
    "How large is the battery?",
  );
  expect(updated.content).toContain("4,500 mAh");
  expect(updated.content).not.toContain("4,000 mAh");
  expect(updated.sourceVersions).toContainEqual({
    id: "specification",
    version: "version-b",
  });
});

it("retrieves profile-wide private notes only for the authenticated sending profile", async () => {
  const { service, task, scope, sourceLinks, docs } = fixture();
  for (const profileId of [
    "buyer-profile",
    "telegram-profile",
    "other-profile",
  ]) {
    const id = `note-${profileId}`;
    docs.push({ ...docs[1], id, content: id, contentHash: "current" });
    sourceLinks.push({
      profileId,
      knowledgeModuleSourceId: id,
      variant: "customer-memory",
      storeId: null,
      projectId: null,
    });
  }
  const result = await service.context(
    task,
    { memory: scope, senderProfileId: "telegram-profile" },
    "My usual style",
  );
  expect(result.personalKnowledgeSourceIds).toEqual([
    "same-brand",
    "note-telegram-profile",
  ]);
  expect(result.content).toContain("note-telegram-profile");
  expect(result.content).not.toMatch(/note-buyer-profile|note-other-profile/);
  const anonymous = await service.context(task, {}, "My usual style");
  expect(anonymous.personalKnowledgeSourceIds).toEqual([]);
});

it("uses the sending and assigned profiles' current sources in the authorized task scope", async () => {
  const { service, task, scope, source, sourceLinks, docs, publicSource } =
    fixture();
  const addSource = (
    id: string,
    profileId: string,
    restrictions: Partial<
      Pick<ISourceLink, "storeId" | "projectId" | "offerId">
    > = {},
  ) => {
    docs.push({
      ...publicSource,
      id,
      title: id,
      content: "Battery reference",
      contentHash: id,
    });
    sourceLinks.push({
      profileId,
      knowledgeModuleSourceId: id,
      variant: "default",
      storeId: null,
      projectId: null,
      ...restrictions,
    });
  };
  addSource("sender-reference", "telegram-profile");
  addSource("agent-reference", "assigned-profile", { storeId: task.storeId });
  addSource("project-reference", "telegram-profile", { projectId: "north" });
  addSource("product-expert-personal-reference", "expert");
  addSource("different-subject-reference", "other-profile");
  addSource("default-profile-reference", "buyer-profile");
  addSource("different-store-reference", "assigned-profile", {
    storeId: "store-2",
  });
  addSource("different-offer-reference", "assigned-profile", {
    offerId: "offer-2",
  });
  addSource("different-project-reference", "telegram-profile", {
    projectId: "south",
  });
  sourceLinks.push({
    profileId: "assigned-profile",
    knowledgeModuleSourceId: "other-customer",
    variant: "default",
    storeId: null,
    projectId: null,
  });

  const profiles = {
    senderProfileId: "telegram-profile",
    agentProfileId: "assigned-profile",
    memory: scope,
  };
  const result = await service.context(task, profiles, "battery");
  expect(new Set(result.knowledgeSourceIds)).toEqual(
    new Set([
      "specification",
      "sender-reference",
      "agent-reference",
      "same-brand",
    ]),
  );
  expect(result.personalKnowledgeSourceIds).toEqual([
    "sender-reference",
    "same-brand",
  ]);
  expect(result.content).not.toMatch(
    /project-reference|different-|default-profile-reference|product-expert-personal-reference|Another buyer/,
  );
  expect(new Set(source.findSourcesByIds.mock.calls[0][0])).toEqual(
    new Set([
      "specification",
      "sender-reference",
      "agent-reference",
      "other-customer",
      "same-brand",
    ]),
  );
  expect(mockSearch).toHaveBeenCalledWith(
    expect.objectContaining({ sourceIds: result.knowledgeSourceIds }),
  );
});

it("leaves reference context empty when neither participant has available sources", async () => {
  const { service, task, source, resolveStoreExpert } = fixture();
  resolveStoreExpert.mockResolvedValue({ conflict: false });
  const result = await service.context(
    { ...task, productId: null, offerId: null },
    { senderProfileId: "no-sources", agentProfileId: "another-empty-profile" },
    "Hello",
  );
  expect(result).toMatchObject({
    content: "",
    sourceVersions: [],
    knowledgeCandidateVersions: [],
    knowledgeSourceIds: [],
    personalKnowledgeSourceIds: [],
  });
  expect(source.findSourcesByIds).not.toHaveBeenCalled();
  expect(mockSearch).not.toHaveBeenCalled();
});

it("gathers eligible versions without reading knowledge and receipts only matching retrieved excerpts", async () => {
  const { service, task, scope } = fixture();
  const candidates = await service.context(
    task,
    {
      agentProfileId: "assigned-profile",
      memory: scope,
      knowledgeScopeOnly: true,
    },
    "Please continue",
  );
  expect(mockSearch).not.toHaveBeenCalled();
  expect(candidates.sourceVersions).toEqual([]);
  expect(candidates.knowledgeCandidateVersions).toEqual([
    { id: "specification", version: "version-a" },
    { id: "same-brand", version: "same-brand" },
  ]);
  expect(candidates.content).not.toMatch(/mAh|formal address/);

  mockSearch.mockResolvedValueOnce([
    {
      sourceId: "specification",
      sourceVersion: "newer",
      text: "Different content",
    },
    {
      sourceId: "same-brand",
      sourceVersion: "same-brand",
      text: "Use formal address",
    },
    {
      sourceId: "other-customer",
      sourceVersion: "other-customer",
      text: "A different buyer's note",
    },
  ]);
  const retrieved = await service.context(
    task,
    { agentProfileId: "assigned-profile", memory: scope },
    "Please continue",
    ["What greeting do I prefer for North?"],
  );
  expect(mockSearch).toHaveBeenCalledWith({
    sourceIds: ["specification", "same-brand"],
    personalSourceIds: ["same-brand"],
    query: expect.stringContaining("What greeting do I prefer for North?"),
    topK: 6,
    finalTopK: 4,
  });
  expect(retrieved.content).toContain("Use formal address");
  expect(retrieved.content).not.toMatch(/Different content|different buyer/);
  expect(retrieved.sourceVersions).toEqual([
    { id: "same-brand", version: "same-brand" },
  ]);
});

it("learns a natural remember command only in the customer's scoped personal profile", async () => {
  const { service, scope, source, linkSource, authenticate } = fixture();
  const text = "В заказах для North обращайтесь ко мне на «вы».";
  const command = {
    text: `Запомни, что ${text} Какой нужен размер?`,
    taskId: "task",
    operationKey: "customer-event",
  };
  const saved = {
    id: "created-note",
    variant: "customer-memory",
    content: text,
  };
  source.upsertSourceBySlug.mockResolvedValue(saved);
  source.lock.mockResolvedValue([saved]);
  expect(isPersonalMemoryCommand(command.text)).toBe(true);
  expect(isMemoryOnlyMessage(command.text)).toBe(false);
  expect(customerWorkInputText(command.text)).toBe("Какой нужен размер?");
  expect(customerWorkInputText(`Что нужно приложить?\nЗапомни: ${text}`)).toBe(
    "Что нужно приложить?",
  );
  expect(customerWorkInputText(`Запомни: ${text}`)).toBe("");
  expect(isMemoryOnlyMessage(`Запомни: ${text}`)).toBe(true);
  expect(isPersonalMemoryCommand("Можно запомнить этот цвет?")).toBe(false);
  expect(isPersonalMemoryCommand("Remember the warranty we discussed?")).toBe(
    false,
  );
  const sourceId = await service.rememberFromMessage(scope, command);
  expect(sourceId).toBe("created-note");
  expect(source.upsertSourceBySlug).toHaveBeenCalledWith(
    {
      slug: "customer-memory-buyer-profile-customer-event",
      title: "Personal note",
      variant: "customer-memory",
      content: text,
    },
    true,
  );
  expect(linkSource).toHaveBeenCalledWith({
    data: {
      variant: "customer-memory",
      profileId: "buyer-profile",
      knowledgeModuleSourceId: "created-note",
    },
  });
  expect(mockIndex).toHaveBeenCalledWith({ sourceId });
  await expect(service.rememberFromMessage(scope, command)).resolves.toBe(
    sourceId,
  );
  expect(linkSource).toHaveBeenCalledTimes(1);

  source.lock.mockResolvedValue([{ ...saved, content: "Changed note" }]);
  await expect(service.rememberFromMessage(scope, command)).rejects.toThrow(
    "another personal note",
  );
  expect(linkSource).toHaveBeenCalledTimes(1);

  authenticate.mockResolvedValue({ authenticated: false });
  await expect(service.rememberFromMessage(scope, command)).rejects.toThrow(
    "Sign in to save personal notes",
  );
  expect(linkSource).toHaveBeenCalledTimes(1);
});

it("rejects changes to legacy project notes and another customer's notes", async () => {
  const { service, scope, source } = fixture();
  for (const sourceId of [
    "other-brand",
    "other-store",
    "other-customer",
    "specification",
  ]) {
    await expect(
      service.record(scope, {
        operation: "remember",
        storeId: scope.storeId,
        taskId: "task",
        operationKey: "edit",
        text: "Unauthorized update",
        sourceId,
      }),
    ).rejects.toThrow("personal note is unavailable");
  }
  expect(source.updateSource).not.toHaveBeenCalled();
});

it("gives the painter only the current buyer’s scoped notes and proven training for the assigned employee", async () => {
  const { service, task, scope, docs, sourceLinks, trainingOrigins } =
    fixture();
  const note =
    "В моих карточках мебели терракотовая надпись должна оставаться целиком на свободном молочном поле под товаром.";
  docs.find(({ id }) => id === "same-brand")!.content = note;
  const messageId = "dffa6ed5-8170-4b85-8c8a-faa696f81221";
  const unverifiedId = "e2d87c39-dc96-47e1-8bf8-916dfac4efc2";
  const otherEmployeeId = "839f1233-a389-4b1d-a86d-371103e3712d";
  for (const [id, profileId, slug, content] of [
    [
      "trained",
      "assigned-profile",
      `store-employee-training-${messageId}`,
      "Цвет надписи: #BC6148",
    ],
    ["ordinary", "assigned-profile", "ordinary", "Цвет надписи: #99CCDD"],
    [
      "without-origin",
      "assigned-profile",
      `store-employee-training-${unverifiedId}`,
      "Цвет надписи: #000000",
    ],
    [
      "other-agent",
      "sender-profile",
      `store-employee-training-${otherEmployeeId}`,
      "Цвет надписи: #DD6633",
    ],
  ]) {
    docs.push({
      id,
      slug,
      title: id,
      variant: "default",
      content,
      contentHash: id,
      updatedAt: new Date(),
    });
    sourceLinks.push({
      variant: "default",
      profileId,
      knowledgeModuleSourceId: id,
      storeId: task.storeId,
      projectId: null,
    });
  }
  trainingOrigins.mockResolvedValue([
    { knowledgeModuleSourceId: "trained", messageId },
    { knowledgeModuleSourceId: "other-agent", messageId: otherEmployeeId },
  ]);
  const result = await service.context(
    { ...task, assigneeKind: "ai", assigneeId: "assigned-agent" },
    {
      agentProfileId: "assigned-profile",
      senderProfileId: "sender-profile",
      memory: scope,
      stage: {
        name: "Обложка",
        output: "image",
        defaultAssigneeSubjectId: "assigned-agent",
        skillIds: ["selected"],
      },
    },
    "Цвет надписи",
  );
  expect(result.captionDefaults).toEqual({
    customer: [note],
    agent: ["Use an embossed linen texture.", "Цвет надписи: #BC6148"],
  });
  expect(result.content).toContain("#99CCDD");
  expect(result.content).toContain("#000000");
  expect(trainingOrigins).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        filters: {
          and: [
            { column: "kind", method: "eq", value: "origin" },
            {
              column: "knowledgeModuleSourceId",
              method: "inArray",
              value: ["trained", "without-origin"],
            },
          ],
        },
      },
    }),
  );
});

it("does not load an additional product expert's role or sources for another assignee", async () => {
  const { service, task, resolveStoreExpert, expertDescription } = fixture();
  const result = await service.context(
    task,
    { agentProfileId: "another-employee" },
    "Question",
  );
  expect(resolveStoreExpert).not.toHaveBeenCalled();
  expect(result.content).not.toContain(expertDescription);
  expect(result.knowledgeSourceIds).toEqual([]);
});
