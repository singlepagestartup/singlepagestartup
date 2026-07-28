/**
 * BDD Suite: factory mutation cache handling.
 *
 * Given: a factory-backed SDK uses React Query mutations.
 * When: create, update, or delete succeeds.
 * Then: internal cache handling runs before the user's onSuccess callback and
 *       the full React Query v5 callback arguments are forwarded.
 */

import { QueryClient, useMutation } from "@tanstack/react-query";
import { factory } from "./index";

jest.mock("react", () => {
  const actual = jest.requireActual("react");

  return {
    ...actual,
    useEffect: jest.fn(),
  };
});

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");

  return {
    ...actual,
    useMutation: jest.fn((options) => options),
  };
});

jest.mock("@sps/shared-frontend-client-store", () => {
  return {
    globalActionsStore: {
      getState: jest.fn(() => ({
        addAction: jest.fn(),
        getActionsFromStoreByName: jest.fn(() => []),
      })),
      subscribe: jest.fn(() => jest.fn()),
    },
  };
});

type Item = { id: string; name: string };

const ROUTE = "/api/test/items";

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function makeApi(queryClient: QueryClient) {
  return factory<Item>({
    host: "http://api.test",
    queryClient,
    route: ROUTE,
  });
}

describe("factory mutation onSuccess merge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: Create patches list cache before user onSuccess.
   *
   * Given: a factory list query is cached and a user onSuccess callback exists.
   * When:  the create mutation succeeds.
   * Then:  the item is appended before the user callback receives all args.
   */
  it("runs create cache handling before forwarding user onSuccess args", async () => {
    const queryClient = makeClient();
    const listKey = [ROUTE, undefined];
    queryClient.setQueryData<Item[]>(listKey, [{ id: "1", name: "Alice" }]);
    const userOnSuccess = jest.fn(() => {
      expect(queryClient.getQueryData<Item[]>(listKey)).toEqual([
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ]);
    });

    const mutation = makeApi(queryClient).create({
      reactQueryOptions: {
        onSuccess: userOnSuccess,
      },
    }) as any;

    const data = { id: "2", name: "Bob" };
    const variables = { data: { name: "Bob" } };
    const onMutateResult = { optimistic: true };
    const context = { client: queryClient };

    await mutation.onSuccess(data, variables, onMutateResult, context);

    expect(userOnSuccess).toHaveBeenCalledWith(
      data,
      variables,
      onMutateResult,
      context,
    );
    expect(useMutation).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: Update patches list and detail cache before user onSuccess.
   *
   * Given: list and findById query data are cached for the same item.
   * When:  the update mutation succeeds.
   * Then:  both caches are patched before the user callback receives all args.
   */
  it("runs update cache handling before forwarding user onSuccess args", async () => {
    const queryClient = makeClient();
    const listKey = [ROUTE, undefined];
    const detailKey = [`${ROUTE}/1`, undefined];
    queryClient.setQueryData<Item[]>(listKey, [{ id: "1", name: "Alice" }]);
    queryClient.setQueryData<Item>(detailKey, { id: "1", name: "Alice" });
    const userOnSuccess = jest.fn(() => {
      expect(queryClient.getQueryData<Item[]>(listKey)?.[0]).toEqual({
        id: "1",
        name: "Alice Updated",
      });
      expect(queryClient.getQueryData<Item>(detailKey)).toEqual({
        id: "1",
        name: "Alice Updated",
      });
    });

    const mutation = makeApi(queryClient).update({
      id: "1",
      reactQueryOptions: {
        onSuccess: userOnSuccess,
      },
    }) as any;

    const data = { id: "1", name: "Alice Updated" };
    const variables = { data: { name: "Alice Updated" } };
    const onMutateResult = { optimistic: true };
    const context = { client: queryClient };

    await mutation.onSuccess(data, variables, onMutateResult, context);

    expect(userOnSuccess).toHaveBeenCalledWith(
      data,
      variables,
      onMutateResult,
      context,
    );
  });

  /**
   * BDD Scenario: Delete removes item before user onSuccess.
   *
   * Given: list and findById query data are cached for an item.
   * When:  the delete mutation succeeds.
   * Then:  list/detail caches are updated before the user callback receives all
   *        React Query callback args.
   */
  it("runs delete cache handling before forwarding user onSuccess args", async () => {
    const queryClient = makeClient();
    const listKey = [ROUTE, undefined];
    const detailKey = [`${ROUTE}/1`, undefined];
    queryClient.setQueryData<Item[]>(listKey, [{ id: "1", name: "Alice" }]);
    queryClient.setQueryData<Item>(detailKey, { id: "1", name: "Alice" });
    const userOnSuccess = jest.fn(() => {
      expect(queryClient.getQueryData<Item[]>(listKey)).toEqual([]);
      expect(queryClient.getQueryData<Item>(detailKey)).toBeUndefined();
    });

    const mutation = makeApi(queryClient).delete({
      id: "1",
      reactQueryOptions: {
        onSuccess: userOnSuccess,
      },
    }) as any;

    const data = { id: "1", name: "Alice" };
    const variables = { id: "1" };
    const onMutateResult = { optimistic: true };
    const context = { client: queryClient };

    await mutation.onSuccess(data, variables, onMutateResult, context);

    expect(userOnSuccess).toHaveBeenCalledWith(
      data,
      variables,
      onMutateResult,
      context,
    );
  });
});
