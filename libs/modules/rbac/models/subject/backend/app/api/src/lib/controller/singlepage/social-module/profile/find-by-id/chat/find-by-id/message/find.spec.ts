jest.mock("@sps/shared-backend-api", () => ({
  ...jest.requireActual("@sps/shared-backend-api"),
  withConsistencySnapshot: (read: () => Promise<unknown>) => read(),
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "fixture",
  RBAC_JWT_SECRET: "fixture",
}));
import { Handler } from "./find";

function fixture(populate?: string, attachmentMessageId?: string) {
  const ids = Array.from({ length: 105 }, (_, i) => String(i).padStart(3, "0"));
  const placements = jest.fn(async ({ params }) => {
    const after =
      params.filters.and.find(
        (filter: { method: string }) => filter.method === "gt",
      )?.value ?? "";
    return ids
      .filter((id) => id > after)
      .slice(0, params.limit ?? ids.length)
      .map((id) => ({ id, messageId: id }));
  });
  const findMessages = jest.fn(async ({ params }) =>
    params.filters.and[0].value.map((id: string) => ({
      id,
      variant: "default",
      createdAt: new Date(id === "000" ? 2 : 1),
      description: "Private notes",
      metadata: { internal: "omitted" },
    })),
  );
  const links = jest.fn(async ({ params }) =>
    ["000", "101", "104"]
      .filter((id) => params.filters.and[0].value.includes(id))
      .map((messageId) => ({
        messageId,
        fileStorageModuleFileId: "file" + messageId,
      })),
  );
  const received = jest.fn((payload) => payload);
  const context = {
    req: {
      param: (key: string) =>
        ({
          id: "buyer",
          socialModuleProfileId: "profile",
          socialModuleChatId: "chat",
          socialModuleThreadId: "thread",
        })[key],
      query: () => attachmentMessageId,
    },
    get: () => ({ populate }),
    json: received,
  };
  const threadAccess = jest.fn();
  const membership = jest.fn(async () => [{ id: "member" }]);
  const readBytes = jest.fn();
  const service = {
    socialModuleChatLifecycleAssertThreadBelongsToChat: threadAccess,
    modules: {
      social: {
        profilesToChats: { find: membership },
        threadsToMessages: { find: placements },
        message: { find: findMessages },
        messagesToFileStorageModuleFiles: { find: links },
        profilesToMessages: { find: async () => [] },
      },
      fileStorage: {
        file: {
          find: async ({ params }: any) =>
            params.filters.and[0].value.map((id: string) => ({
              id,
              adminTitle: id,
              file: "/stored.txt",
            })),
          readBytes,
        },
      },
    },
  };
  const handler = new Handler(service as any);
  return {
    run: () => handler.execute(context as any, jest.fn()),
    received,
    readBytes,
    placements,
    findMessages,
    threadAccess,
  };
}

it("serves the complete scoped attachment directory in stable order while keeping the normal timeline page size", async () => {
  const directory = fixture("attachment-index");
  await directory.run();
  expect(directory.received).toHaveBeenCalledWith({
    data: ["101", "104", "000"].map((id) => ({
      id,
      variant: "default",
      privateAttachments: [],
      publicAttachmentRefs: [{ id: "file" + id, name: "file" + id }],
    })),
  });
  expect(directory.placements).toHaveBeenCalledTimes(2);
  expect(directory.placements.mock.calls[0][0].params).toMatchObject({
    limit: 100,
    filters: { and: [{ column: "threadId", method: "eq", value: "thread" }] },
    orderBy: { and: [{ column: "id", method: "asc" }] },
  });
  expect(
    directory.placements.mock.calls[1][0].params.filters.and,
  ).toContainEqual({ column: "id", method: "gt", value: "099" });
  expect(
    directory.findMessages.mock.calls.map(
      ([{ params }]) => params.filters.and[0].value.length,
    ),
  ).toEqual([100, 5]);
  expect(directory.readBytes).not.toHaveBeenCalled();
  const regular = fixture();
  await regular.run();
  expect(regular.placements.mock.calls[0][0].params.limit).toBe(100);
});

it("checks thread access before listing anything and binds a requested file's message to the same thread", async () => {
  const blocked = fixture("attachment-index");
  blocked.threadAccess.mockRejectedValueOnce(
    new Error("Forbidden error. No thread access"),
  );
  await expect(blocked.run()).rejects.toThrow();
  expect(blocked.placements).not.toHaveBeenCalled();
  const messageId = "3f95a45c-3273-4c01-a23e-2dc73ec22dd5";
  const file = fixture(undefined, messageId);
  file.placements.mockResolvedValueOnce([]);
  await file.run();
  expect(file.placements.mock.calls[0][0].params.filters.and).toEqual([
    { column: "threadId", method: "eq", value: "thread" },
    { column: "messageId", method: "eq", value: messageId },
  ]);
  expect(file.findMessages).not.toHaveBeenCalled();
});
