const createThread = jest.fn();
const updateThread = jest.fn();
const updateNamespace = jest.fn();
const createLink = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));
jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: {
    create: (...args: any[]) => createThread(...args),
    update: (...args: any[]) => updateThread(...args),
    updateMetadataNamespace: (...args: any[]) => updateNamespace(...args),
  },
}));
jest.mock("@sps/social/relations/chats-to-threads/sdk/server", () => ({
  api: { create: (...args: any[]) => createLink(...args) },
}));
import { Service } from "./documents";

function fixture(initial: any) {
  const threads = [
    initial,
    {
      id: "topic",
      title: "Other conversation",
      metadata: { aiChatDocument: { profileId: "project", sourceIds: [] } },
    },
  ];
  const links = threads.map((thread) => ({
    chatId: "chat",
    threadId: thread.id,
  }));
  createThread.mockImplementation(async ({ data }) => {
    const thread = { id: `created-${createThread.mock.calls.length}`, ...data };
    threads.push(thread);
    return thread;
  });
  updateThread.mockImplementation(async ({ id, data }) => {
    const thread = threads.find((thread) => thread.id === id)!;
    Object.assign(thread, data);
    return thread;
  });
  updateNamespace.mockImplementation(
    async ({ id, namespace, expectedValue, value }) => {
      const thread = threads.find((thread) => thread.id === id)!;
      if (
        JSON.stringify(thread.metadata[namespace] ?? null) !==
        JSON.stringify(expectedValue)
      )
        return null;
      thread.metadata = { ...thread.metadata, [namespace]: value };
      return thread;
    },
  );
  createLink.mockImplementation(async ({ data }) => {
    links.push(data);
    return data;
  });
  const service = new Service({
    chatsToThreads: { find: jest.fn().mockImplementation(async () => links) },
    thread: {
      find: jest
        .fn()
        .mockImplementation(async ({ params }) =>
          threads.filter((thread) =>
            params.filters.and.every((filter: any) =>
              filter.method === "inArray"
                ? filter.value.includes(thread[filter.column])
                : thread[filter.column] === filter.value,
            ),
          ),
        ),
    },
  } as any);
  return { service, initial, threads, links };
}
beforeEach(() => jest.clearAllMocks());
it("creates five ordered documents during project creation and reuses the lifecycle Thread for Brief", async () => {
  const { service, initial, threads, links } = fixture({
    id: "initial",
    metadata: { unrelated: true },
  });
  const result = await service.execute({
    profileId: "project",
    chatId: "chat",
    initialThread: initial,
  });
  expect(result.map((thread) => thread.title)).toEqual([
    "Brief.md",
    "Strategy.md",
    "Brand.md",
    "Design.md",
    "Products.md",
  ]);
  expect(result[0].id).toBe("initial");
  expect(result[0].metadata).toEqual({
    unrelated: true,
    aiChatDocument: { key: "brief", profileId: "project", sourceIds: [] },
  });
  expect(createThread).toHaveBeenCalledTimes(4);
  expect(links).toHaveLength(6);
  expect(
    threads.find((thread) => thread.id === "topic")!.metadata.aiChatDocument,
  ).not.toHaveProperty("key");
  await service.execute({
    profileId: "project",
    chatId: "chat",
    initialThread: initial,
  });
  expect(createThread).toHaveBeenCalledTimes(4);
  expect(updateThread).toHaveBeenCalledTimes(1);
});
it("keeps the existing Products Thread, Knowledge IDs and unrelated metadata while adding missing documents", async () => {
  const { service, initial } = fixture({
    id: "products",
    title: "Products.md",
    metadata: {
      preferences: "keep",
      aiChatDocument: {
        profileId: "project",
        sourceIds: ["products-source", "bookings-source"],
      },
    },
  });
  const result = await service.execute({
    profileId: "project",
    chatId: "chat",
    initialThread: initial,
  });
  expect(result[4]).toEqual(
    expect.objectContaining({
      id: "products",
      metadata: {
        preferences: "keep",
        aiChatDocument: {
          key: "products",
          profileId: "project",
          sourceIds: ["products-source", "bookings-source"],
        },
      },
    }),
  );
  expect(
    result
      .slice(0, 4)
      .every((thread) => thread.metadata.aiChatDocument.sourceIds.length === 0),
  ).toBe(true);
  await service.execute({
    profileId: "project",
    chatId: "chat",
    initialThread: initial,
  });
  expect(createThread).toHaveBeenCalledTimes(4);
});
it("reuses a document saved before a failed relation write on retry", async () => {
  const { service, initial } = fixture({ id: "initial", metadata: {} });
  createLink.mockRejectedValueOnce(new Error("Temporary relation failure"));
  await expect(
    service.execute({
      profileId: "project",
      chatId: "chat",
      initialThread: initial,
    }),
  ).rejects.toThrow("Temporary relation failure");
  const savedId = createThread.mock.results[0].value;
  const result = await service.execute({
    profileId: "project",
    chatId: "chat",
    initialThread: initial,
  });
  expect(result[1].id).toBe((await savedId).id);
  expect(createThread).toHaveBeenCalledTimes(4);
});
