import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
const addAction = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: (options: unknown) => options,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-api"),
  queryClient,
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction }) },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));

import { action } from "./update";

it("patches thread readers before awaiting the consumer success callback with all mutation arguments", async () => {
  const scoped = "/api/rbac/subjects/owner/social-module/chats/chat/threads";
  const original = { id: "thread", title: "Old" };
  const result = { ...original, title: "New" };
  queryClient.setQueryData([scoped + "?limit=10"], [original]);
  queryClient.setQueryData(["/api/social/threads"], [original]);
  queryClient.setQueryData(["/api/social/threads/thread"], original);
  const variables = {
    id: "owner",
    socialModuleChatId: "chat",
    socialModuleThreadId: "thread",
    data: { title: "New" },
  };
  let finish: () => void = () => undefined;
  const callbackResult = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const onSuccess = jest.fn(() => {
    expect(queryClient.getQueryData([scoped + "?limit=10"])).toEqual([result]);
    expect(queryClient.getQueryData(["/api/social/threads"])).toEqual([result]);
    expect(queryClient.getQueryData(["/api/social/threads/thread"])).toEqual(
      result,
    );
    expect(addAction).toHaveBeenCalledWith(
      expect.objectContaining({ props: variables }),
    );
    return callbackResult;
  });
  const mutation = action({
    ...variables,
    reactQueryOptions: { onSuccess },
  }) as any;
  const args = [
    result,
    variables,
    { optimistic: true },
    { client: queryClient },
  ];
  let completed = false;
  const completion = mutation.onSuccess(...args).then(() => {
    completed = true;
  });
  expect(onSuccess).toHaveBeenCalledWith(...args);
  await Promise.resolve();
  expect(completed).toBe(false);
  finish();
  await completion;
  expect(completed).toBe(true);
});
