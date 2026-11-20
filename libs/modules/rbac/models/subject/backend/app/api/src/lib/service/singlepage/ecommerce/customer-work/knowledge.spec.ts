import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import { Service as Projects } from "../../social-module/profile/projects";
import { Service, StageSkillsUnavailable } from "./knowledge";

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
  };
  const privateSource = (id: string, content: string) => ({
    id,
    variant: "customer-memory",
    title: "Personal note",
    content,
    contentHash: id,
    updatedAt: new Date(),
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
      profileId: "expert",
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
      projectId: "north",
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
    find: jest.fn(
      async ({
        params,
      }: {
        params: { filters: { and: [{ value: string[] }, { value: string }] } };
      }) => {
        const [ids, variant] = params.filters.and;
        return docs.filter(
          (row) => ids.value.includes(row.id) && row.variant !== variant.value,
        );
      },
    ),
    updateSource: jest.fn(),
  };
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
  const subject = {
    authenticationMe: async () => ({ authenticated: true }),
    modules: {
      social: {
        profilesToEcommerceModuleProducts: { resolveStoreExpert },
        profile: {
          findById: async () => ({
            id: "expert",
            variant: "artificial-intelligence",
          }),
        },
        profilesToKnowledgeModuleSources: { find: find(sourceLinks) },
        profilesToSkills: { linkedSkills },
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
    projectId: "north",
  };
  const projects = [
    { thread: { id: "north", title: "North" }, profile: {} },
    { thread: { id: "south", title: "South" }, profile: {} },
  ] as Awaited<ReturnType<Projects["find"]>>;
  const projectRead = jest
    .spyOn(Projects.prototype, "find")
    .mockResolvedValue(projects);
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
    projectRead,
  };
}

afterEach(() => jest.restoreAllMocks());

it("reads employee training knowledge for its store and reflects edits or deletion", async () => {
  const { service, task, sourceLinks, docs } = fixture();
  const taught = {
    id: "employee-source",
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
      { ...profiles, stage },
      "cover styling",
    ),
  ).rejects.toBeInstanceOf(StageSkillsUnavailable);
});

it("uses the current offer expert and only the buyer's selected store and brand memory", async () => {
  const { service, task, scope, publicSource, source, resolveStoreExpert } =
    fixture();
  const original = await service.context(
    task,
    { memory: scope },
    "How large is the battery?",
  );
  expect(original.content).toContain("4,000 mAh");
  expect(original.content).toContain("Use formal address for North");
  expect(original.content).not.toMatch(/South|Another shop|Another buyer/);
  expect(source.findSourcesByIds).toHaveBeenCalledWith(["same-brand"]);
  expect(resolveStoreExpert).toHaveBeenCalledWith({
    storeId: task.storeId,
    offerId: task.offerId,
    productId: task.productId,
  });
  expect(original.knowledgeSourceIds).toEqual(["specification"]);
  expect(original.sourceVersions).toEqual([
    { id: "specification", version: "version-a" },
    { id: "same-brand", version: "same-brand" },
  ]);

  publicSource.content = "The current battery is 4,500 mAh.";
  publicSource.contentHash = "version-b";
  const updated = await service.context(
    task,
    { memory: scope },
    "How large is the battery?",
  );
  expect(updated.content).toContain("4,500 mAh");
  expect(updated.content).not.toContain("4,000 mAh");
  expect(updated.sourceVersions).toContainEqual({
    id: "specification",
    version: "version-b",
  });
});

it("uses the sending and assigned profiles' current sources in the authorized task scope", async () => {
  const {
    service,
    task,
    scope,
    source,
    sourceLinks,
    docs,
    publicSource,
    projectRead,
  } = fixture();
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
  expect(result.knowledgeSourceIds).toEqual([
    "specification",
    "sender-reference",
    "agent-reference",
    "project-reference",
  ]);
  expect(result.content).not.toMatch(
    /different-|default-profile-reference|product-expert-personal-reference|Another buyer/,
  );
  expect(
    new Set(source.find.mock.calls[0][0].params.filters.and[0].value),
  ).toEqual(
    new Set([
      "specification",
      "sender-reference",
      "agent-reference",
      "project-reference",
      "other-customer",
    ]),
  );

  projectRead.mockResolvedValue([]);
  const revoked = await service.context(task, profiles, "battery");
  expect(revoked.content).not.toMatch(/project-reference|Use formal address/);
  expect(revoked.knowledgeSourceIds).toEqual([
    "specification",
    "sender-reference",
    "agent-reference",
  ]);
});

it("leaves reference context empty when neither participant has available sources", async () => {
  const { service, task, source, resolveStoreExpert } = fixture();
  resolveStoreExpert.mockResolvedValue({ conflict: false });
  const result = await service.context(
    { ...task, productId: null, offerId: null },
    { senderProfileId: "no-sources", agentProfileId: "another-empty-profile" },
    "Hello",
  );
  expect(result).toEqual({
    content: "",
    sourceVersions: [],
    knowledgeSourceIds: [],
  });
  expect(source.find).not.toHaveBeenCalled();
});

it("rejects direct changes to another project or customer's note", async () => {
  const { service, scope, source } = fixture();
  for (const sourceId of [
    "other-brand",
    "other-store",
    "other-customer",
    "specification",
  ]) {
    await expect(
      service.record(
        scope,
        { id: "thread", memoryProjectId: "north" },
        {
          operation: "remember",
          storeId: scope.storeId,
          taskId: "task",
          operationKey: "edit",
          text: "Unauthorized update",
          sourceId,
        },
      ),
    ).rejects.toThrow("personal note is unavailable");
  }
  expect(source.updateSource).not.toHaveBeenCalled();
});

it("withdraws project memory on the next read and rejects competing offer experts", async () => {
  const { service, task, scope, projectRead, resolveStoreExpert } = fixture();
  projectRead.mockResolvedValue([]);
  const current = await service.context(task, { memory: scope }, "battery");
  expect(current.content).not.toContain("Use formal address for North");
  expect(current.sourceVersions).toEqual([
    { id: "specification", version: "version-a" },
  ]);
  resolveStoreExpert.mockResolvedValue({ conflict: true });
  await expect(
    service.context(task, { memory: scope }, "battery"),
  ).rejects.toThrow("competing expert assignments");
});
