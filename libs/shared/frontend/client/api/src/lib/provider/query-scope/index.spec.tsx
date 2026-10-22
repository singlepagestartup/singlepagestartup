/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { StrictMode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { factory } from "../../factory";
import { patchInListQueries } from "../../cache";
import { QueryScopeProvider } from ".";
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "scope-test" }));
const route = "/api/website-builder/widgets";
const host = "http://api.test";
const ownsScope = (scope: unknown, owner: string) =>
  typeof scope === "string" && scope.startsWith(`${owner}:`);
interface IRow {
  id: string;
  value: number;
}
let client: QueryClient;
let api: ReturnType<typeof factory<IRow>>;
const reads = { public: jest.fn(), first: jest.fn(), second: jest.fn() };
function Row({ name }: { name: keyof typeof reads }) {
  const data = api.find({
    reactQueryOptions: {
      queryFn: async () => {
        reads[name]();
        return [{ id: "row", value: reads[name].mock.calls.length }];
      },
      staleTime: Infinity,
      retry: false,
    },
  });
  return <span data-testid={name}>{data.data?.[0]?.value ?? "loading"}</span>;
}
function View({
  first = true,
  strict = false,
}: {
  first?: boolean;
  strict?: boolean;
}) {
  const rows = (
    <>
      <Row name="public" />
      {first ? (
        <QueryScopeProvider scopeKey="first">
          <Row name="first" />
        </QueryScopeProvider>
      ) : null}
      <QueryScopeProvider scopeKey="second">
        <Row name="second" />
      </QueryScopeProvider>
    </>
  );
  return (
    <QueryClientProvider client={client}>
      {strict ? <StrictMode>{rows}</StrictMode> : rows}
    </QueryClientProvider>
  );
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api = factory<IRow>({ route, host, queryClient: client });
  Object.values(reads).forEach((read) => read.mockReset());
});
afterEach(() => client.clear());
it("closing one protected subtree preserves public and another protected observer, mutation patches and later invalidation", async () => {
  const { rerender } = render(<View />);
  for (const name of ["public", "first", "second"])
    await waitFor(() =>
      expect(screen.getByTestId(name)).toHaveTextContent("1"),
    );
  expect(client.getQueryCache().getAll()).toHaveLength(3);
  const publicQuery = client
    .getQueryCache()
    .getAll()
    .find((query) => !query.meta?.protectedContentScope)!;
  const secondQuery = client
    .getQueryCache()
    .getAll()
    .find((query) => ownsScope(query.meta?.protectedContentScope, "second"))!;
  rerender(<View first={false} />);
  await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(2));
  expect(client.getQueryCache().getAll()).toContain(publicQuery);
  expect(client.getQueryCache().getAll()).toContain(secondQuery);
  expect(publicQuery.getObserversCount()).toBe(1);
  expect(secondQuery.getObserversCount()).toBe(1);
  act(() => patchInListQueries<IRow>(client, route, "row", { value: 42 }));
  for (const name of ["public", "second"])
    await waitFor(() =>
      expect(screen.getByTestId(name)).toHaveTextContent("42"),
    );
  await act(async () => {
    await client.invalidateQueries({ queryKey: [route] });
  });
  for (const name of ["public", "second"])
    await waitFor(() =>
      expect(screen.getByTestId(name)).toHaveTextContent("2"),
    );
  expect(reads.first).toHaveBeenCalledTimes(1);
  expect(reads.public).toHaveBeenCalledTimes(2);
  expect(reads.second).toHaveBeenCalledTimes(2);
});
it("Strict Mode effect replay retains scoped cache attachment and unmount removes only the closing scope", async () => {
  const { rerender } = render(<View strict />);
  await waitFor(() =>
    expect(screen.getByTestId("first")).not.toHaveTextContent("loading"),
  );
  const query = client
    .getQueryCache()
    .getAll()
    .find((query) => ownsScope(query.meta?.protectedContentScope, "first"))!;
  expect(query.getObserversCount()).toBe(1);
  const count = reads.first.mock.calls.length;
  await act(async () => {
    await client.invalidateQueries({
      predicate: (query) =>
        ownsScope(query.meta?.protectedContentScope, "first"),
    });
  });
  expect(reads.first).toHaveBeenCalledTimes(count + 1);
  expect(client.getQueryCache().getAll()).toContain(query);
  rerender(<View strict first={false} />);
  await waitFor(() =>
    expect(
      client
        .getQueryCache()
        .getAll()
        .filter((query) =>
          ownsScope(query.meta?.protectedContentScope, "first"),
        ),
    ).toHaveLength(0),
  );
  expect(
    client
      .getQueryCache()
      .getAll()
      .filter((query) =>
        ownsScope(query.meta?.protectedContentScope, "second"),
      ),
  ).toHaveLength(1);
});
it("all factory read methods retain principal/host positions and prevent options escaping a protected key or metadata", async () => {
  function AllReads() {
    const options = {
      queryKey: ["escape"],
      queryHash: "escape",
      queryKeyHashFn: () => "escape",
      meta: {
        protectedContentScope: "escape",
        custom: "retained",
        topics: ["custom.topic"],
      },
      retry: false,
    };
    api.find({ reactQueryOptions: { ...options, queryFn: async () => [] } });
    api.findById({
      id: "record",
      reactQueryOptions: {
        ...options,
        queryFn: async () => ({ id: "record", value: 1 }),
      },
    });
    api.count({ reactQueryOptions: { ...options, queryFn: async () => 1 } });
    return null;
  }
  render(
    <QueryClientProvider client={client}>
      <QueryScopeProvider scopeKey="owned">
        <AllReads />
      </QueryScopeProvider>
    </QueryClientProvider>,
  );
  await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(3));
  for (const query of client.getQueryCache().getAll()) {
    expect(query.queryKey[0]).toMatch(/^\/api\/website-builder\/widgets/);
    expect(query.queryKey[2]).toEqual({ principal: "", host });
    expect(query.queryKey[3]).toEqual({
      protectedContentScope: expect.stringMatching(/^owned:/),
    });
    expect(query.meta).toEqual({
      protectedContentScope: expect.stringMatching(/^owned:/),
      custom: "retained",
      topics: ["custom.topic"],
    });
    expect(query.gcTime).toBe(0);
  }
});

it("a closing scope cannot detach a replacement subtree while cancellation is pending", async () => {
  const { rerender } = render(<View />);
  await waitFor(() =>
    expect(screen.getByTestId("first")).toHaveTextContent("1"),
  );
  const cancel = client.cancelQueries.bind(client);
  let finishCancellation: (() => void) | undefined;
  jest.spyOn(client, "cancelQueries").mockImplementation((filters, options) => {
    void cancel(filters, options);
    return new Promise<void>((resolve) => {
      finishCancellation = resolve;
    });
  });
  rerender(<View first={false} />);
  await waitFor(() => expect(finishCancellation).toBeDefined());
  await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(2));
  rerender(<View />);
  await waitFor(() =>
    expect(screen.getByTestId("first")).toHaveTextContent("2"),
  );
  const replacement = client
    .getQueryCache()
    .getAll()
    .find((query) => ownsScope(query.meta?.protectedContentScope, "first"))!;
  expect(replacement.getObserversCount()).toBe(1);
  await act(async () => {
    finishCancellation!();
  });
  expect(client.getQueryCache().getAll()).toContain(replacement);
  await act(async () => {
    await client.invalidateQueries({ queryKey: [route] });
  });
  await waitFor(() =>
    expect(screen.getByTestId("first")).toHaveTextContent("3"),
  );
});

it("returning to the same scope on a mounted Provider keeps its active observer after old cancellation", async () => {
  function ChangingScope({ scope }: { scope: string }) {
    return (
      <QueryClientProvider client={client}>
        <QueryScopeProvider scopeKey={scope}>
          <Row name="first" />
        </QueryScopeProvider>
      </QueryClientProvider>
    );
  }
  const { rerender } = render(<ChangingScope scope="first" />);
  await waitFor(() =>
    expect(screen.getByTestId("first")).toHaveTextContent("1"),
  );
  const original = client.getQueryCache().getAll()[0];
  jest.useFakeTimers();
  const cancel = client.cancelQueries.bind(client);
  const cancellations: (() => void)[] = [];
  jest.spyOn(client, "cancelQueries").mockImplementation((filters, options) => {
    void cancel(filters, options);
    return new Promise<void>((resolve) => {
      cancellations.push(resolve);
    });
  });
  rerender(<ChangingScope scope="second" />);
  await act(async () => {});
  expect(cancellations).toHaveLength(1);
  rerender(<ChangingScope scope="first" />);
  await act(async () => {
    cancellations[0]();
  });
  expect(client.getQueryCache().getAll()).toContain(original);
  expect(original.getObserversCount()).toBe(1);
  const count = reads.first.mock.calls.length;
  await act(async () => {
    await client.invalidateQueries({ queryKey: [route] });
    jest.runOnlyPendingTimers();
  });
  expect(reads.first).toHaveBeenCalledTimes(count + 1);
  jest.useRealTimers();
});
