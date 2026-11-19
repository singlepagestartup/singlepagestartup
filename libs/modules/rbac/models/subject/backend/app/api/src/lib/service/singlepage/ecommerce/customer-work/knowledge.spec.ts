import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import { Service as Projects } from "../../social-module/profile/projects";
import { Service } from "./knowledge";

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
  const sourceLinks = [
    {
      profileId: "expert",
      knowledgeModuleSourceId: publicSource.id,
      variant: "default",
      storeId: null,
      projectId: null,
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
  const expertLinks = [
    {
      profileId: "expert",
      storeId: "store-1",
      offerId: "offer-1",
      variant: "store-expert",
    },
    {
      profileId: "other-expert",
      storeId: "store-1",
      ecommerceModuleProductId: "phone",
      variant: "store-expert",
    },
    {
      profileId: "other-store-expert",
      storeId: "store-2",
      offerId: "offer-1",
      variant: "store-expert",
    },
  ];
  const find =
    <Row extends Record<string, unknown>>(rows: Row[]) =>
    async ({
      params,
    }: {
      params: { filters: { and: { column: string; value: string }[] } };
    }) =>
      rows.filter((row) =>
        params.filters.and.every(({ column, value }) => row[column] === value),
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
  const subject = {
    authenticationMe: async () => ({ authenticated: true }),
    modules: {
      social: {
        profilesToEcommerceModuleProducts: { find: find(expertLinks) },
        profile: {
          findById: async () => ({
            id: "expert",
            variant: "artificial-intelligence",
          }),
        },
        profilesToKnowledgeModuleSources: { find: find(sourceLinks) },
        profilesToSkills: { find: async () => [] },
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
    expertLinks,
    projectRead,
  };
}

afterEach(() => jest.restoreAllMocks());

it("uses the current offer expert and only the buyer's selected store and brand memory", async () => {
  const { service, task, scope, publicSource, source } = fixture();
  const original = await service.context(
    task,
    scope,
    "How large is the battery?",
  );
  expect(original.content).toContain("4,000 mAh");
  expect(original.content).toContain("Use formal address for North");
  expect(original.content).not.toMatch(/South|Another shop|Another buyer/);
  expect(source.findSourcesByIds).toHaveBeenCalledWith(["same-brand"]);
  expect(original.knowledgeSourceIds).toEqual(["specification"]);
  expect(original.sourceVersions).toEqual([
    { id: "specification", version: "version-a" },
    { id: "same-brand", version: "same-brand" },
  ]);

  publicSource.content = "The current battery is 4,500 mAh.";
  publicSource.contentHash = "version-b";
  const updated = await service.context(
    task,
    scope,
    "How large is the battery?",
  );
  expect(updated.content).toContain("4,500 mAh");
  expect(updated.content).not.toContain("4,000 mAh");
  expect(updated.sourceVersions).toContainEqual({
    id: "specification",
    version: "version-b",
  });
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
  const { service, task, scope, projectRead, expertLinks } = fixture();
  projectRead.mockResolvedValue([]);
  const current = await service.context(task, scope, "battery");
  expect(current.content).not.toContain("Use formal address for North");
  expect(current.sourceVersions).toEqual([
    { id: "specification", version: "version-a" },
  ]);
  expertLinks.push({ ...expertLinks[0], profileId: "competing-expert" });
  await expect(service.context(task, scope, "battery")).rejects.toThrow(
    "competing expert assignments",
  );
});
