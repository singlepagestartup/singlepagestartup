/**
 * BDD Suite: factory subscription invalidation timing.
 *
 * Given: a route subscription listens for revalidation broadcasts.
 * When: a broadcast with matching topics or a matching route payload arrives.
 * Then: invalidation fires immediately (bounded 0-200 ms jitter, no fixed
 *       1-second delay) and duplicate broadcasts do not double-invalidate.
 */

let storeSubscribers: Array<(state: unknown) => void> = [];

jest.mock("@sps/shared-frontend-client-store", () => {
  return {
    globalActionsStore: {
      subscribe: jest.fn((callback: (state: unknown) => void) => {
        storeSubscribers.push(callback);

        return () => {
          storeSubscribers = storeSubscribers.filter(
            (subscriber) => subscriber !== callback,
          );
        };
      }),
      getState: jest.fn(() => ({
        addAction: jest.fn(),
        getActionsFromStoreByName: jest.fn(() => []),
      })),
    },
  };
});

import { QueryClient } from "@tanstack/react-query";
import { subscription } from "./index";

const JITTER_MAX_MS = 200;

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function makeRevalidationState(message: {
  payload: string;
  topics: string[];
  createdAt: string;
}) {
  return {
    getActionsFromStoreByName: () => [
      {
        type: "query",
        name: "revalidation",
        requestId: "request-1",
        timestamp: Date.now(),
        props: {},
        result: {
          slug: "revalidation",
          payload: message.payload,
          topics: message.topics,
          createdAt: message.createdAt,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      },
    ],
  };
}

function emit(state: unknown) {
  for (const subscriber of [...storeSubscribers]) {
    subscriber(state);
  }
}

async function seedTopicQuery(
  queryClient: QueryClient,
  queryKey: unknown[],
  topics: string[],
) {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => [{ id: "1" }],
    meta: { topics },
  });
}

describe("subscription invalidation timing", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    storeSubscribers = [];
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: Topic-matching broadcast invalidates within the jitter bound.
   *
   * Given: a cached query carries meta.topics and a subscription is active.
   * When:  a revalidation broadcast with a matching topic arrives.
   * Then:  invalidation fires within 200 ms - not after the legacy 1 s delay.
   */
  it("invalidates topic-matching queries within the jitter bound", async () => {
    const queryClient = makeClient();
    await seedTopicQuery(
      queryClient,
      ["/api/social/messages-a"],
      ["social.messages"],
    );
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const unsubscribe = subscription("/api/test/topic-route-a", queryClient);

    emit(
      makeRevalidationState({
        payload: "/api/social/messages-a",
        topics: ["social.messages"],
        createdAt: new Date(Date.now() + 1).toISOString(),
      }),
    );

    expect(invalidateSpy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(JITTER_MAX_MS);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  /**
   * BDD Scenario: Route-fallback broadcast invalidates within the jitter bound.
   *
   * Given: a broadcast without usable topics but with a payload matching the
   *        subscribed route.
   * When:  the broadcast arrives.
   * Then:  the route is invalidated within 200 ms.
   */
  it("invalidates the route fallback within the jitter bound", () => {
    const queryClient = makeClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const route = "/api/test/fallback-route-b";
    const unsubscribe = subscription(route, queryClient);

    emit(
      makeRevalidationState({
        payload: route,
        topics: [],
        createdAt: new Date(Date.now() + 1).toISOString(),
      }),
    );

    expect(invalidateSpy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(JITTER_MAX_MS);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [route] });

    unsubscribe();
  });

  /**
   * BDD Scenario: Duplicate topic broadcasts are deduplicated.
   *
   * Given: the same revalidation broadcast (same createdAt + topics) is
   *        delivered twice.
   * When:  both deliveries are processed.
   * Then:  invalidation runs exactly once.
   */
  it("does not double-invalidate duplicate topic broadcasts", async () => {
    const queryClient = makeClient();
    await seedTopicQuery(
      queryClient,
      ["/api/social/messages-c"],
      ["social.messages-c"],
    );
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const unsubscribe = subscription("/api/test/topic-route-c", queryClient);

    const state = makeRevalidationState({
      payload: "/api/social/messages-c",
      topics: ["social.messages-c"],
      createdAt: new Date(Date.now() + 2).toISOString(),
    });

    emit(state);
    emit(state);

    jest.advanceTimersByTime(JITTER_MAX_MS);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  /**
   * BDD Scenario: One broadcast triggers ONE global topic invalidation even
   * with many route subscriptions.
   *
   * Given: multiple routes are subscribed (each owns its own store listener),
   *        as on a page with many SDK queries.
   * When:  a single topic-matching broadcast is delivered to every listener.
   * Then:  exactly one invalidation runs — the dedup is global, preventing a
   *        refetch storm of one invalidation per subscribed route.
   */
  it("deduplicates one broadcast across many route subscriptions", async () => {
    const queryClient = makeClient();
    await seedTopicQuery(
      queryClient,
      ["/api/social/messages-e"],
      ["social.messages-e"],
    );
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const unsubscribeFns = [
      subscription("/api/test/multi-route-1", queryClient),
      subscription("/api/test/multi-route-2", queryClient),
      subscription("/api/test/multi-route-3", queryClient),
    ];

    emit(
      makeRevalidationState({
        payload: "/api/social/messages-e",
        topics: ["social.messages-e"],
        createdAt: new Date(Date.now() + 3).toISOString(),
      }),
    );

    jest.advanceTimersByTime(JITTER_MAX_MS);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    unsubscribeFns.forEach((unsubscribe) => unsubscribe());
  });

  /**
   * BDD Scenario: A topic-less route query still invalidates when a SIBLING
   * query matches the broadcast topics (issue #195 F2).
   *
   * Given: a route is subscribed and that route's OWN cached query carries no
   *        matching meta.topics, while a sibling query on the SAME client does
   *        match the broadcast topics; the broadcast payload matches the route.
   * When:  the topic-matching broadcast arrives.
   * Then:  the global topic invalidation fires for the sibling AND the per-route
   *        fallback still fires for this route - the route is not starved by the
   *        unrelated sibling's topic coverage.
   */
  it("invalidates a topic-less route query when a sibling has matching topics", async () => {
    const queryClient = makeClient();
    const route = "/api/test/topicless-route-f";

    // This route's OWN query: keyed by the route, but NO matching topics.
    await seedTopicQuery(queryClient, [route, undefined], []);
    // A sibling query (different route) that DOES match the broadcast topics.
    await seedTopicQuery(
      queryClient,
      ["/api/social/messages-f"],
      ["social.messages-f"],
    );

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const unsubscribe = subscription(route, queryClient);

    emit(
      makeRevalidationState({
        // Payload matches THIS route so the per-route fallback is eligible.
        payload: route,
        topics: ["social.messages-f"],
        createdAt: new Date(Date.now() + 1).toISOString(),
      }),
    );

    jest.advanceTimersByTime(JITTER_MAX_MS);

    // Both the global topic invalidation (for the sibling) and the per-route
    // fallback (for this topic-less route) run.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [route] });
    expect(
      invalidateSpy.mock.calls.some(
        (call) => typeof (call[0] as any)?.predicate === "function",
      ),
    ).toBe(true);

    unsubscribe();
  });

  /**
   * BDD Scenario: The per-route fallback IS skipped when this route's own query
   * is covered by the topic invalidation (issue #195 F2 - no double work).
   *
   * Given: the subscribed route's OWN query carries matching meta.topics.
   * When:  a topic-matching broadcast arrives.
   * Then:  only the global topic invalidation runs - the per-route fallback is
   *        correctly skipped because this route is already topic-covered.
   */
  it("skips the per-route fallback when this route's query is topic-covered", async () => {
    const queryClient = makeClient();
    const route = "/api/test/topic-covered-route-g";

    // This route's own query carries matching topics.
    await seedTopicQuery(queryClient, [route, undefined], ["test.topic-g"]);

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const unsubscribe = subscription(route, queryClient);

    emit(
      makeRevalidationState({
        payload: route,
        topics: ["test.topic-g"],
        createdAt: new Date(Date.now() + 1).toISOString(),
      }),
    );

    jest.advanceTimersByTime(JITTER_MAX_MS);

    // Exactly one invalidation - the predicate-based global one. The plain
    // route-key fallback must NOT have fired.
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [route] });

    unsubscribe();
  });

  /**
   * BDD Scenario: Two independent QueryClients do not suppress each other's
   * topic invalidation (issue #195 F5).
   *
   * Given: two separate QueryClients (as under SSR request isolation or in-band
   *        tests), each with a query matching the same broadcast topics.
   * When:  the SAME broadcast (same createdAt + topics) is delivered to a
   *        subscription on each client.
   * Then:  BOTH clients invalidate - the dedup is scoped per-client, so one
   *        client's dedup does not swallow the other's invalidation.
   */
  it("does not let one client's dedup suppress another client's invalidation", async () => {
    const clientA = makeClient();
    const clientB = makeClient();
    await seedTopicQuery(
      clientA,
      ["/api/social/messages-h"],
      ["social.messages-h"],
    );
    await seedTopicQuery(
      clientB,
      ["/api/social/messages-h"],
      ["social.messages-h"],
    );

    const invalidateSpyA = jest.spyOn(clientA, "invalidateQueries");
    const invalidateSpyB = jest.spyOn(clientB, "invalidateQueries");

    const unsubscribeA = subscription("/api/test/multi-client-a", clientA);
    const unsubscribeB = subscription("/api/test/multi-client-b", clientB);

    const state = makeRevalidationState({
      payload: "/api/social/messages-h",
      topics: ["social.messages-h"],
      createdAt: new Date(Date.now() + 1).toISOString(),
    });

    // The single broadcast reaches both clients' listeners.
    emit(state);

    jest.advanceTimersByTime(JITTER_MAX_MS);

    expect(invalidateSpyA).toHaveBeenCalledTimes(1);
    expect(invalidateSpyB).toHaveBeenCalledTimes(1);

    unsubscribeA();
    unsubscribeB();
  });

  /**
   * BDD Scenario: Jitter stays within its bound.
   *
   * Given: Math.random returns its maximum.
   * When:  a matching broadcast is processed.
   * Then:  invalidation is scheduled no later than 200 ms.
   */
  it("schedules invalidation no later than the jitter maximum", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.999999);
    const queryClient = makeClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const route = "/api/test/fallback-route-d";
    const unsubscribe = subscription(route, queryClient);

    emit(
      makeRevalidationState({
        payload: route,
        topics: [],
        createdAt: new Date(Date.now() + 1).toISOString(),
      }),
    );

    // Math.floor(0.999999 * 200) = 199 - the maximum possible jitter delay.
    jest.advanceTimersByTime(JITTER_MAX_MS - 2);
    expect(invalidateSpy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
