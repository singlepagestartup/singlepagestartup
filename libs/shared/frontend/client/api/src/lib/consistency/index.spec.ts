/** @jest-environment jsdom */
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { CONSISTENCY_RESPONSE_EVENT } from "@sps/shared-utils";
import { queryConsistency } from ".";

const metadata = (ref: string) => ({
  protocol: 1,
  ref,
  epoch: "test",
  cursor: "1",
  expiresAt: new Date(Date.now() + 60000).toISOString(),
});
const response = (url: string, ref: string) =>
  window.dispatchEvent(
    new CustomEvent(CONSISTENCY_RESPONSE_EVENT, {
      detail: { url, metadata: metadata(ref) },
    }),
  );
const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

it("targets two of twenty active queries without refetching the other eighteen", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const state = queryConsistency(client);
  const fetchers = Array.from({ length: 20 }, (_, i) =>
    jest.fn(async () => {
      response(`http://localhost/api/records?scope=${i}`, `scope-${i}`);
      return [{ id: i }];
    }),
  );
  const observers = fetchers.map(
    (queryFn, i) =>
      new QueryObserver(client, {
        queryKey: ["/api/records", { scope: i }],
        queryFn,
      }),
  );
  const cleanup = observers.map((observer) => observer.subscribe(() => {}));
  await flush();
  state.receive({
    protocol: 1,
    type: "invalidate",
    epoch: "test",
    cursor: "2",
    refs: ["scope-2", "scope-12"],
  });
  await flush();
  fetchers.forEach((fetcher, i) =>
    expect(fetcher).toHaveBeenCalledTimes(i === 2 || i === 12 ? 2 : 1),
  );
  cleanup.forEach((unsubscribe) => unsubscribe());
  state.destroy();
  client.clear();
});

it("reconciles a shared dependency without refetching an unrelated query or losing structural sharing", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const state = queryConsistency(client);
  state.setConnected(true);
  const row = { id: "message", description: "unchanged" };
  const fetchMessages = jest.fn(async () => {
    response("http://localhost/api/messages?thread=one", "messages");
    return [{ ...row }];
  });
  const fetchOther = jest.fn(async () => {
    response("http://localhost/api/messages?thread=two", "other");
    return [];
  });
  const first = new QueryObserver(client, {
    queryKey: ["/api/messages", "thread=one"],
    queryFn: fetchMessages,
  });
  const second = new QueryObserver(client, {
    queryKey: ["/api/messages", { thread: "two" }],
    queryFn: fetchOther,
  });
  const unsub = [first.subscribe(() => {}), second.subscribe(() => {})];
  await flush();
  const before = first.getCurrentResult().data?.[0];
  state.receive({
    protocol: 1,
    type: "invalidate",
    epoch: "test",
    cursor: "2",
    refs: ["messages"],
  });
  await flush();
  expect(fetchMessages).toHaveBeenCalledTimes(2);
  expect(fetchOther).toHaveBeenCalledTimes(1);
  expect(first.getCurrentResult().data?.[0]).toBe(before);
  unsub.forEach((fn) => fn());
  state.destroy();
  client.clear();
});

it("does not lose an event received during the initial fetch and coalesces a burst", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const state = queryConsistency(client);
  let release!: () => void;
  const gate = new Promise<void>((done) => (release = done));
  const fetcher = jest.fn(async () => {
    response("http://localhost/api/messages", "pending");
    if (fetcher.mock.calls.length === 1) await gate;
    return [];
  });
  const observer = new QueryObserver(client, {
    queryKey: ["/api/messages"],
    queryFn: fetcher,
  });
  const unsubscribe = observer.subscribe(() => {});
  await flush();
  for (let i = 2; i < 12; i++)
    state.receive({
      protocol: 1,
      type: "invalidate",
      epoch: "test",
      cursor: String(i),
      refs: ["pending"],
    });
  release();
  await flush();
  expect(fetcher.mock.calls.length).toBeLessThanOrEqual(3);
  expect(fetcher.mock.calls.length).toBeGreaterThan(1);
  unsubscribe();
  state.destroy();
  client.clear();
});

it("clears a previously loaded private result when reconciliation loses access", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const state = queryConsistency(client);
  let denied = false;
  const observer = new QueryObserver(client, {
    queryKey: ["/api/private"],
    queryFn: async () => {
      if (denied) throw Object.assign(new Error("Forbidden"), { status: 403 });
      response("http://localhost/api/private", "private");
      return { secret: "test" };
    },
  });
  const unsubscribe = observer.subscribe(() => {});
  await flush();
  denied = true;
  state.receive({
    protocol: 1,
    type: "invalidate",
    epoch: "test",
    cursor: "2",
    refs: ["private"],
  });
  await flush();
  expect(observer.getCurrentResult().data).toBeUndefined();
  unsubscribe();
  state.destroy();
  client.clear();
});

it("keeps addressed realtime refetch attached when private scope follows the principal/host key partition", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const state = queryConsistency(client);
  state.setConnected(true);
  const firstFetch = jest.fn(async () => {
    response("http://localhost/api/records?slot=first", "private-first");
    return [{ id: "first" }];
  });
  const secondFetch = jest.fn(async () => {
    response("http://localhost/api/records?slot=second", "private-second");
    return [{ id: "second" }];
  });
  const first = new QueryObserver(client, {
    queryKey: [
      "/api/records",
      { slot: "first" },
      { principal: "subject", host: "http://localhost" },
      { protectedContentScope: "first" },
    ],
    queryFn: firstFetch,
    meta: { protectedContentScope: "first" },
  });
  const second = new QueryObserver(client, {
    queryKey: [
      "/api/records",
      { slot: "second" },
      { principal: "subject", host: "http://localhost" },
      { protectedContentScope: "second" },
    ],
    queryFn: secondFetch,
    meta: { protectedContentScope: "second" },
  });
  const unsubscribeFirst = first.subscribe(() => {});
  const unsubscribeSecond = second.subscribe(() => {});
  await flush();
  unsubscribeFirst();
  client.removeQueries({
    predicate: (query) => query.meta?.protectedContentScope === "first",
  });
  state.receive({
    protocol: 1,
    type: "invalidate",
    epoch: "test",
    cursor: "2",
    refs: ["private-second"],
  });
  await flush();
  expect(firstFetch).toHaveBeenCalledTimes(1);
  expect(secondFetch).toHaveBeenCalledTimes(2);
  expect(client.getQueryCache().getAll()).toHaveLength(1);
  expect(second.getCurrentResult().data).toEqual([{ id: "second" }]);
  unsubscribeSecond();
  state.destroy();
  client.clear();
});
