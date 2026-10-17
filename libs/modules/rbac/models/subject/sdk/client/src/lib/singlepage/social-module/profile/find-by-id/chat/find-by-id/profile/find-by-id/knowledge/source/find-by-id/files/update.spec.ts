import { QueryClient } from "@tanstack/react-query";
const queryClient = new QueryClient();
const addAction = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: (options: any) => options,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-api"),
  queryClient,
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction }) },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
import { action } from "./update";
it("updates owner-scoped Knowledge and Files caches immediately while keeping realtime and consumer callbacks", () => {
  const scope =
    "/api/rbac/subjects/subject/social-module/profiles/requester/chats/chat/profiles/assistant/knowledge/sources";
  const key = scope + "?limit=&offset=";
  const otherKey =
    scope.replace("profiles/assistant/", "profiles/other/") + "?limit=&offset=";
  queryClient.setQueryData(
    [key],
    [
      { id: "source", title: "Products", content: "Old content" },
      { id: "other-source", content: "Other content" },
    ],
  );
  queryClient.setQueryData(
    [otherKey],
    [{ id: "source", content: "Other scope" }],
  );
  const other = queryClient.getQueryData([otherKey]);
  const detailKey = ["/api/knowledge/sources/source", undefined];
  queryClient.setQueryData(detailKey, { id: "source", content: "Old content" });
  const result = {
    source: {
      id: "source",
      title: "Products",
      content: "Analyzed file content",
    },
    files: [{ file: { id: "file" }, relation: { id: "relation" } }],
  };
  const onSuccess = jest.fn();
  const mutation: any = action({ onSuccess });
  mutation.onSuccess(result, {
    id: "subject",
    socialModuleProfileId: "requester",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "assistant",
    knowledgeModuleSourceId: "source",
  });
  expect(queryClient.getQueryData([key])).toEqual([
    result.source,
    { id: "other-source", content: "Other content" },
  ]);
  expect(queryClient.getQueryData([scope + "/source/files"])).toEqual(
    result.files,
  );
  expect(queryClient.getQueryData([otherKey])).toBe(other);
  expect(queryClient.getQueryData(detailKey)).toEqual(result.source);
  expect(addAction).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "mutation",
      name: "/api/knowledge/sources-to-file-storage-module-files",
    }),
  );
  expect(onSuccess).toHaveBeenCalledWith(result);
});
