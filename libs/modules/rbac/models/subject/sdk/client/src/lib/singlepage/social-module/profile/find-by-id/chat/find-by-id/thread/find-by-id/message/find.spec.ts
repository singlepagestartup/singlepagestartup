const mockUseQuery = jest.fn((options) => options);
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: unknown) => mockUseQuery(options),
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost",
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {},
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: jest.fn(),
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: jest.fn() }));
jest.mock("@sps/shared-frontend-client-api", () => ({
  consistencyQueryKey: jest.requireActual(
    "../../../../../../../../../../../../../../../../../shared/frontend/client/api/src/lib/consistency",
  ).consistencyQueryKey,
  queryClient: {},
  subscription: jest.fn(),
}));

import { QueryClient } from "@tanstack/react-query";
import {
  appendToListQueries,
  patchInListQueries,
  removeFromListQueries,
} from "../../../../../../../../../../../../../../../../../shared/frontend/client/api/src/lib/cache";
import { action } from "./find";

it("keeps the scoped attachment directory separate and reconciles entity writes without copying message fields", async () => {
  const scope = {
    id: "subject",
    socialModuleProfileId: "profile",
    socialModuleChatId: "chat",
    socialModuleThreadId: "thread",
  };
  action(scope);
  action({
    ...scope,
    attachmentIndex: true,
    reactQueryOptions: { meta: { topics: ["custom.topic"] } },
  });
  action({ ...scope, params: { attachmentMessageId: "message" } });
  action({ ...scope, socialModuleThreadId: "other", attachmentIndex: true });
  const [timeline, directory, single, other] = mockUseQuery.mock.calls.map(
    ([options]) => options,
  );
  const [path] = timeline.queryKey;
  expect(directory.queryKey).toEqual([
    path,
    "populate=attachment-index",
    ...timeline.queryKey.slice(2),
  ]);
  expect(single.queryKey).toEqual([
    path,
    "attachmentMessageId=message",
    ...timeline.queryKey.slice(2),
  ]);
  expect(other.queryKey[0]).not.toEqual(path);
  expect(timeline.meta.topics).not.toContain("file-storage.files");
  expect(directory.meta.topics).toEqual(
    expect.arrayContaining([
      "file-storage.files",
      "social.threads-to-messages",
      "custom.topic",
    ]),
  );
  const client = new QueryClient();
  const descriptor = {
    id: "message",
    privateAttachments: [],
    publicAttachmentRefs: [{ id: "file", name: "notes.txt" }],
  };
  client.setQueryDefaults(directory.queryKey, { meta: directory.meta });
  const seed = () => client.setQueryData(directory.queryKey, [descriptor]);
  seed();
  client.setQueryData(timeline.queryKey, [
    { id: "message", description: "old" },
  ]);
  patchInListQueries(client, path, "message", {
    id: "message",
    description: "edited",
  });
  expect(client.getQueryData(timeline.queryKey)).toEqual([
    { id: "message", description: "edited" },
  ]);
  expect(client.getQueryData(directory.queryKey)).toEqual([descriptor]);
  expect(client.getQueryState(directory.queryKey)?.isInvalidated).toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  seed();
  appendToListQueries(client, path, { id: "new", description: "new" });
  expect(client.getQueryData(directory.queryKey)).toEqual([descriptor]);
  expect(client.getQueryState(directory.queryKey)?.isInvalidated).toBe(true);
  removeFromListQueries(client, path, "message");
  expect(client.getQueryData(directory.queryKey)).toEqual([]);
  client.clear();
});
