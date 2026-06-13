/**
 * BDD Suite: factory query auto-subscription topics.
 *
 * Given: factory-backed SDK queries for any model route.
 * When: find / findById / count hooks build their React Query options.
 * Then: meta.topics is auto-derived from the canonical shared algorithm, so
 *       every factory query in every project is a realtime listener of its
 *       own data with zero per-model code (issue #195).
 */

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
    useQuery: jest.fn((options) => options),
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

import { QueryClient } from "@tanstack/react-query";
import { factory } from "./index";

const ROUTE = "/api/ecommerce/orders";
const ORDER_ID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";

function makeApi() {
  return factory<{ id: string }>({
    host: "http://api.test",
    queryClient: new QueryClient(),
    route: ROUTE,
  });
}

describe("factory query meta.topics derivation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: List query subscribes to its collection topic.
   */
  it("find subscribes to the collection topic", () => {
    const options = makeApi().find({}) as any;

    expect(options.meta.topics).toEqual(["ecommerce.orders"]);
  });

  /**
   * BDD Scenario: Detail query subscribes to collection + entity topics.
   */
  it("findById subscribes to collection and entity topics", () => {
    const options = makeApi().findById({ id: ORDER_ID }) as any;

    expect(options.meta.topics).toEqual(
      expect.arrayContaining([
        "ecommerce.orders",
        `ecommerce.orders.${ORDER_ID}`,
      ]),
    );
  });

  /**
   * BDD Scenario: Count query subscribes to the collection topic
   * (the /count suffix is stripped by the deriver).
   */
  it("count subscribes to the collection topic", () => {
    const options = makeApi().count({}) as any;

    expect(options.meta.topics).toEqual(["ecommerce.orders"]);
  });

  /**
   * BDD Scenario: A user-supplied reactQueryOptions.meta MERGES with the
   * derived meta instead of clobbering the realtime topics (issue #195 F3).
   *
   * Given: a project passes reactQueryOptions.meta carrying its own keys.
   * When:  find builds its React Query options.
   * Then:  the derived topics survive and the user's extra meta keys are also
   *        present - the trailing reactQueryOptions spread no longer wipes
   *        meta.topics.
   */
  it("merges reactQueryOptions.meta with the derived find topics", () => {
    const options = makeApi().find({
      reactQueryOptions: { meta: { custom: "value" } },
    }) as any;

    expect(options.meta.topics).toEqual(["ecommerce.orders"]);
    expect(options.meta.custom).toBe("value");
  });

  /**
   * BDD Scenario: findById topics survive a user-supplied meta.
   *
   * Given: a project passes reactQueryOptions.meta for a detail query.
   * When:  findById builds its React Query options.
   * Then:  the derived collection + entity topics survive alongside user meta.
   */
  it("merges reactQueryOptions.meta with the derived findById topics", () => {
    const options = makeApi().findById({
      id: ORDER_ID,
      reactQueryOptions: { meta: { custom: "value" } },
    }) as any;

    expect(options.meta.topics).toEqual(
      expect.arrayContaining([
        "ecommerce.orders",
        `ecommerce.orders.${ORDER_ID}`,
      ]),
    );
    expect(options.meta.custom).toBe("value");
  });

  /**
   * BDD Scenario: count topics survive a user-supplied meta.
   *
   * Given: a project passes reactQueryOptions.meta for a count query.
   * When:  count builds its React Query options.
   * Then:  the derived collection topic survives alongside user meta.
   */
  it("merges reactQueryOptions.meta with the derived count topics", () => {
    const options = makeApi().count({
      reactQueryOptions: { meta: { custom: "value" } },
    }) as any;

    expect(options.meta.topics).toEqual(["ecommerce.orders"]);
    expect(options.meta.custom).toBe("value");
  });

  /**
   * BDD Scenario: An explicit topics key in user meta wins, but only because
   * the caller intentionally set topics - merging keeps the override path open
   * for projects that truly want a custom subscription.
   *
   * Given: a project passes reactQueryOptions.meta.topics explicitly.
   * When:  find builds its React Query options.
   * Then:  the explicit topics replace the derived ones (user intent wins).
   */
  it("lets an explicit reactQueryOptions.meta.topics override the derived topics", () => {
    const options = makeApi().find({
      reactQueryOptions: { meta: { topics: ["custom.topic"] } },
    }) as any;

    expect(options.meta.topics).toEqual(["custom.topic"]);
  });
});
