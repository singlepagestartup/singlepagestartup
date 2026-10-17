/** @jest-environment jsdom */
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@sps/shared-frontend-client-api";

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));
const subject = { id: "owner", slug: "owner" };
const mockRead = jest.fn();
const mockForeignRead = jest.fn();
let subscribers: Array<(state: any) => void> = [];
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {
    subscribe: (fn: (state: any) => void) => {
      subscribers.push(fn);
      return () => {
        subscribers = subscribers.filter((item) => item !== fn);
      };
    },
    getState: () => ({
      addAction: jest.fn(),
      getActionsFromStoreByName: () => [],
    }),
  },
}));
jest.mock("react-cookie", () => ({
  useCookies: () => [{ "rbac.subject.jwt": "jwt" }, null, null, jest.fn()],
}));
jest.mock("react-jwt", () => ({
  useJwt: () => ({ decodedToken: { subject } }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://api",
  getAIChatDocument: () => null,
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    socialModuleChatFindByIdThreadFind: (props: unknown) => mockRead(props),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
  api: {
    findById: () => ({ isLoading: false }),
    socialModuleChatFindByIdThreadFind: jest.requireActual(
      "../../../../../../sdk/client/src/lib/singlepage/social-module/chat/find-by-id/thread/find",
    ).action,
  },
}));
jest.mock("@sps/social/models/thread/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: { findById: (...args: unknown[]) => mockForeignRead(...args) },
}));
jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: { findById: mockForeignRead },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/social/models/thread/frontend/component", () => ({
  Component: jest.requireActual(
    "../../../../../../../../../social/models/thread/frontend/component/src/lib/singlepage/id-ai-chat",
  ).Component,
}));
jest.mock(
  "../../../../../../../../../social/models/thread/frontend/component/src/lib/singlepage/id-ai-chat/Component",
  () => ({ Component: (props: any) => <div>{props.data.title}</div> }),
);
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
import { Component } from "./index";

afterEach(() => {
  queryClient.clear();
  subscribers = [];
});
it("uses one scoped SDK query and renders its new data after realtime invalidation", async () => {
  mockRead.mockResolvedValue([{ id: "thread", title: "Before" }]);
  const view = render(
    <Component
      isServer={false}
      variant="me-social-module-profile-id-chat-id-thread-id-ai-chat"
      data={subject as any}
      project={
        {
          profile: { id: "profile" },
          chat: { id: "chat" },
          thread: { id: "thread" },
        } as any
      }
    />,
  );
  await screen.findByText("Before");
  expect(mockRead).toHaveBeenCalledTimes(1);
  expect(mockForeignRead).not.toHaveBeenCalled();
  mockRead.mockResolvedValue([{ id: "thread", title: "After" }]);
  await act(async () => {
    for (const notify of subscribers)
      notify({
        getActionsFromStoreByName: () => [
          {
            type: "query",
            name: "revalidation",
            requestId: "broadcast",
            timestamp: Date.now(),
            result: {
              slug: "revalidation",
              payload: "/api/social/threads/thread",
              topics: ["social.threads"],
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 60000).toISOString(),
            },
          },
        ],
      });
    await new Promise((resolve) => setTimeout(resolve, 250));
  });
  await waitFor(() => expect(screen.getByText("After")).toBeTruthy());
  expect(mockRead).toHaveBeenCalledTimes(2);
  expect(mockForeignRead).not.toHaveBeenCalled();
  view.unmount();
  expect(subscribers).toHaveLength(0);
});
