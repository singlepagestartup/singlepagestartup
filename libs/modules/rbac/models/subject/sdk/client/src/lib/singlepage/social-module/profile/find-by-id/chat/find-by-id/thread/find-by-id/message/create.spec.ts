import { QueryClient } from "@tanstack/react-query";
const queryClient = new QueryClient();
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: (options: unknown) => options,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-api"),
  queryClient,
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction: jest.fn() }) },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: (headers: unknown) => headers,
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
import { action } from "./create";

const props = {
  id: "owner",
  socialModuleProfileId: "profile",
  socialModuleChatId: "chat",
  socialModuleThreadId: "thread",
};
const route =
  "/api/rbac/subjects/owner/social-module/profiles/profile/chats/chat/threads/thread/messages";
beforeEach(() => queryClient.clear());
it("patches the enriched timeline without losing author and attachment data", async () => {
  queryClient.setQueryData([route], []);
  const created = { id: "new", authorProfileIds: ["profile"], attachments: [] };
  await (action(props) as any).onSuccess(created, props, {});
  expect(queryClient.getQueryData([route])).toEqual([created]);
});
it("reconciles a legacy/idempotent plain response without inserting it into the enriched timeline", async () => {
  queryClient.setQueryData([route], []);
  await (action(props) as any).onSuccess({ id: "old" }, props, {});
  expect(queryClient.getQueryData([route])).toEqual([]);
  expect(queryClient.getQueryState([route])?.isInvalidated).toBe(true);
});
