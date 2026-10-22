/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { Component } from "./index";
import { clientHost } from "@sps/rbac/models/subject/sdk/model";
let mockSubject = "subject-a";
let mockPrincipal = "subject-a";
let mockData: any;
let mockError: any;
let mockReceivedAt: number;
let mockObservers = 1;
const mockRefetch = jest.fn(async () => ({}));
const mockCancel = jest.fn(async () => {});
const mockRemove = jest.fn();
const mockRead = jest.fn();
const mockView = jest.fn();
const mockClear = jest.fn();
let mockContentQuery: any;
const mockClient = {
  cancelQueries: mockCancel,
  removeQueries: mockRemove,
  getQueryCache: () => ({
    findAll: ({ predicate }: any) =>
      predicate(mockContentQuery) ? [mockContentQuery] : [],
  }),
};
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => mockClient,
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    blogModuleArticleFindByIdContentFind: (props: any) => {
      mockRead(props);
      return {
        data: mockData,
        dataUpdatedAt: mockReceivedAt,
        error: mockError,
        refetch: mockRefetch,
      };
    },
  },
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-api"),
  consistencyQueryKey: (path: string, _params: any, host: string) => [
    path,
    undefined,
    { principal: mockPrincipal, host },
  ],
}));
jest.mock("../../../../authentication/me-default/client", () => ({
  __esModule: true,
  default: ({ children }: any) =>
    children({ data: { id: mockSubject }, authenticated: false }),
}));
jest.mock("./ClientComponent", () => ({
  Component: (props: any) => {
    mockView(props);
    return <div>{props.state === "ready" ? "GRANTED-BODY" : props.state}</div>;
  },
}));
const props = {
  isServer: false,
  variant: "me-blog-module-article-private-content-default",
  language: "en",
  blogModuleArticle: { id: "article-a" },
} as const;
const path =
  "/api/rbac/subjects/subject-a/blog-module/articles/article-a/content";
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-23T00:00:00Z"));
  mockSubject = "subject-a";
  mockPrincipal = "subject-a";
  mockError = undefined;
  mockReceivedAt = Date.now();
  mockObservers = 1;
  mockContentQuery = {
    queryKey: [path, undefined, { principal: "subject-a", host: clientHost }],
    getObserversCount: () => mockObservers,
    setState: mockClear,
  };
  mockData = {
    articleId: "article-a",
    clientRequestStartedAt: Date.now(),
    checkedAt: "2026-10-23T00:00:00Z",
    access: { state: "granted", expiresAt: "2026-10-23T00:00:01Z" },
    items: [
      {
        kind: "private",
        key: "slot-1",
        orderIndex: 0,
        access: { state: "granted", expiresAt: "2026-10-23T00:00:01Z" },
        relation: {},
        widget: {},
      },
    ],
  };
  jest.clearAllMocks();
  mockRefetch.mockImplementation(async () => ({}));
});
afterEach(() => jest.useRealTimers());
it("uses the own-Subject operation and original request-start deadline, preserving the base query observer during canonical refetch", async () => {
  render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(mockRead).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "subject-a",
      blogModuleArticleId: "article-a",
    }),
  );
  expect(screen.getByText("GRANTED-BODY")).toBeVisible();
  await act(async () => {
    jest.advanceTimersByTime(1001);
  });
  expect(screen.queryByText("GRANTED-BODY")).toBeNull();
  expect(screen.getByText("expired")).toBeVisible();
  expect(mockClear).toHaveBeenCalledWith({ data: undefined, dataUpdatedAt: 0 });
  expect(mockRemove).not.toHaveBeenCalled();
  expect(mockRefetch).toHaveBeenCalled();
  const filter = mockCancel.mock.calls[0][0];
  expect(
    filter.predicate({
      queryKey: [path, undefined, { principal: "subject-a", host: clientHost }],
    }),
  ).toBe(true);
  expect(
    filter.predicate({
      queryKey: [
        "/api/website-builder/widgets",
        undefined,
        { principal: "subject-a", host: clientHost },
      ],
    }),
  ).toBe(false);
  expect(
    filter.predicate({
      queryKey: [path, undefined, { principal: "subject-b", host: clientHost }],
    }),
  ).toBe(false);
});
it("never mounts an expired warm-cache grant when a second consumer mounts during a failed refetch", async () => {
  render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  mockError = { status: 503 };
  mockRefetch.mockImplementation(() => new Promise(() => {}));
  mockView.mockClear();
  render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(mockView.mock.calls.every(([p]) => p.state !== "ready")).toBe(true);
  expect(screen.queryByText("GRANTED-BODY")).toBeNull();
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(screen.queryByText("GRANTED-BODY")).toBeNull();
});
it("a failed access revalidation closes a previously valid grant until explicit successful retry", async () => {
  const { rerender } = render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(screen.getByText("GRANTED-BODY")).toBeVisible();
  mockError = { status: 503 };
  rerender(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(screen.queryByText("GRANTED-BODY")).toBeNull();
  expect(screen.getByText("error")).toBeVisible();
  await act(async () => {
    mockView.mock.calls.at(-1)![0].onRetry();
  });
  expect(mockRefetch).toHaveBeenCalled();
  mockError = undefined;
  mockData = { ...mockData, clientRequestStartedAt: Date.now() };
  rerender(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(screen.getByText("GRANTED-BODY")).toBeVisible();
});

it("401/403 hides cached granted data immediately", () => {
  const { rerender } = render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  mockError = { status: 403 };
  rerender(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(screen.queryByText("GRANTED-BODY")).toBeNull();
  expect(screen.getByText("error")).toBeVisible();
});
it("principal changes clear only the now-unused old content operation", async () => {
  const { rerender } = render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  mockObservers = 0;
  mockSubject = "subject-b";
  mockPrincipal = "subject-b";
  mockData = undefined;
  rerender(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  await act(async () => {});
  expect(screen.queryByText("GRANTED-BODY")).toBeNull();
  expect(mockRead).toHaveBeenLastCalledWith(
    expect.objectContaining({ id: "subject-b" }),
  );
  expect(mockClear).toHaveBeenCalledWith({ data: undefined, dataUpdatedAt: 0 });
  expect(mockRemove).not.toHaveBeenCalled();
});
it("a tenant change clears its unused old partition without clearing Website Builder families", async () => {
  const { rerender } = render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  mockObservers = 0;
  mockPrincipal = "subject-a:tenant-b";
  mockData = undefined;
  rerender(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  await act(async () => {});
  expect(mockClear).toHaveBeenCalled();
  expect(mockCancel).toHaveBeenCalledWith({
    queryKey: mockContentQuery.queryKey,
    exact: true,
  });
});
it("unmounting one consumer retains a shared content result still observed by another consumer", async () => {
  const { unmount } = render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  mockObservers = 1;
  unmount();
  await act(async () => {});
  expect(mockClear).not.toHaveBeenCalled();
  expect(mockRemove).not.toHaveBeenCalled();
});

it("never mounts a successful grant whose transport completes after the server lifetime", async () => {
  const result = mockData;
  mockData = undefined;
  const { rerender } = render(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(screen.getByText("checking")).toBeVisible();
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  mockData = result;
  mockReceivedAt = Date.now();
  mockView.mockClear();
  rerender(
    <Component {...props} blogModuleArticle={props.blogModuleArticle as any} />,
  );
  expect(mockView.mock.calls.every(([view]) => view.state !== "ready")).toBe(
    true,
  );
  expect(screen.queryByText("GRANTED-BODY")).toBeNull();
  expect(screen.getByText("expired")).toBeVisible();
});
