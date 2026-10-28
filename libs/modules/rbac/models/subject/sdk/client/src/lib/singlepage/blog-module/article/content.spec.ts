import { action } from "./content";
import { queryClient } from "@sps/shared-frontend-client-api";
const mockTransport = jest.fn();
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: any) => options,
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    blogModuleArticleFindByIdContentFind: (props: any) => mockTransport(props),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://api.test",
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: (headers: any) => headers,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  queryClient: new (jest.requireActual("@tanstack/react-query").QueryClient)(),
  subscription: jest.fn(),
  consistencyQueryKey: (path: string, _params: any, host: string) => [
    path,
    undefined,
    { principal: "subject", host },
  ],
}));
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-23T00:00:00Z"));
  mockTransport.mockReset();
  queryClient.clear();
});
afterEach(() => {
  jest.useRealTimers();
  queryClient.clear();
});
it("stores an immutable request-start timestamp on the successful result before transport latency and forwards cancellation", async () => {
  const start = Date.now();
  let resolve!: (value: any) => void;
  mockTransport.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const operation = action({
    id: "subject",
    blogModuleArticleId: "article",
  }) as any;
  const controller = new AbortController();
  const pending = operation.queryFn({ signal: controller.signal });
  jest.advanceTimersByTime(2000);
  resolve({
    articleId: "article",
    checkedAt: new Date(start).toISOString(),
    access: {
      state: "granted",
      expiresAt: new Date(start + 1000).toISOString(),
    },
    items: [],
    clientRequestStartedAt: Date.now(),
  });
  const result = await pending;
  expect(result.clientRequestStartedAt).toBe(start);
  expect(result.clientRequestStartedAt).not.toBe(Date.now());
  expect(mockTransport).toHaveBeenCalledWith(
    expect.objectContaining({
      options: expect.objectContaining({ signal: controller.signal }),
    }),
  );
  expect(operation.meta).not.toHaveProperty("clientRequestStartedAt");
});
it("clears inaccessible cached result data after 403 without detaching its shared cache entry", async () => {
  const operation = action({
    id: "subject",
    blogModuleArticleId: "article",
  }) as any;
  queryClient.setQueryData(operation.queryKey, {
    articleId: "article",
    items: [{ widget: { description: "private" } }],
  });
  const query = queryClient
    .getQueryCache()
    .find({ queryKey: operation.queryKey, exact: true });
  mockTransport.mockRejectedValue(
    Object.assign(new Error("Forbidden"), { status: 403 }),
  );
  await expect(
    operation.queryFn({ signal: new AbortController().signal }),
  ).rejects.toThrow("Forbidden");
  expect(
    queryClient
      .getQueryCache()
      .find({ queryKey: operation.queryKey, exact: true }),
  ).toBe(query);
  expect(query?.state.data).toBeUndefined();
});

it("failed access revalidation retains public references and opaque positions while removing every protected payload", async () => {
  const operation = action({
    id: "subject",
    blogModuleArticleId: "article",
  }) as any;
  const publicItem = {
    kind: "public",
    key: "public",
    orderIndex: 0,
    relation: { id: "public-link" },
    widget: { id: "public-widget" },
  };
  const cached = {
    articleId: "article",
    checkedAt: new Date().toISOString(),
    clientRequestStartedAt: Date.now(),
    access: {
      state: "granted",
      expiresAt: new Date(Date.now() + 1000).toISOString(),
    },
    items: [
      publicItem,
      {
        kind: "private",
        key: "opaque",
        orderIndex: 1,
        access: {
          state: "granted",
          expiresAt: new Date(Date.now() + 1000).toISOString(),
        },
        relation: { id: "protected-link" },
        widget: { id: "protected-widget", description: "PROTECTED-PAYLOAD" },
      },
    ],
  };
  queryClient.setQueryData(operation.queryKey, cached);
  const before = queryClient.getQueryData<any>(operation.queryKey);
  mockTransport.mockRejectedValue(
    Object.assign(new Error("Access check unavailable"), { status: 503 }),
  );
  await expect(
    operation.queryFn({ signal: new AbortController().signal }),
  ).rejects.toThrow("Access check unavailable");
  const after = queryClient.getQueryData<any>(operation.queryKey);
  expect(after.items[0]).toBe(before.items[0]);
  expect(after.items[1]).toEqual({
    kind: "private",
    key: "opaque",
    orderIndex: 1,
    access: { state: "locked", expiresAt: null },
  });
  expect(after.access).toEqual({ state: "locked", expiresAt: null });
  expect(after.checkedAt).toBe(cached.checkedAt);
  expect(after.clientRequestStartedAt).toBe(cached.clientRequestStartedAt);
  expect(JSON.stringify(after)).not.toMatch(
    /PROTECTED-PAYLOAD|protected-widget|protected-link/,
  );
});
