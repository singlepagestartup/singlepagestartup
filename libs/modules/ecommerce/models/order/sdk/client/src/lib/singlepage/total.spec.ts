const effects: Array<() => () => void> = [];
let subscribers: Array<(state: unknown) => void> = [];
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: (effect: () => () => void) => effects.push(effect),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: unknown) => options,
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {
    subscribe: (callback: (state: unknown) => void) => {
      subscribers.push(callback);
      return () => {
        subscribers = subscribers.filter((item) => item !== callback);
      };
    },
    getState: () => ({ addAction: jest.fn() }),
  },
}));
jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({ api: {} }));
jest.mock("@sps/ecommerce/models/order/sdk/model", () => ({
  route: "/api/ecommerce/orders",
  clientHost: "http://localhost:4000",
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));

import { queryClient } from "@sps/shared-frontend-client-api";
import { QueryObserver } from "@tanstack/react-query";
import { action } from "./total";

beforeEach(() => {
  effects.length = 0;
  queryClient.clear();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

it.each([
  "ecommerce.orders-to-products",
  "ecommerce.products",
  "ecommerce.products-to-attributes",
  "ecommerce.attribute-keys",
  "ecommerce.attribute-keys-to-attributes",
  "ecommerce.attributes",
  "ecommerce.attributes-to-billing-module-currencies",
  "billing.currencies",
])(
  "refetches a warm total when a remote %s record changes and removes its listener on unmount",
  async (topic) => {
    const options = action({
      id: "order",
      reactQueryOptions: { meta: { screen: "purchases" } },
    }) as any;
    let total = 10;
    const queryFn = jest.fn(async () => [{ total }]);
    await queryClient.prefetchQuery({ ...options, queryFn });
    const observer = new QueryObserver(queryClient, { ...options, queryFn });
    const stopObserving = observer.subscribe(() => undefined);
    const cleanup = effects[0]();
    expect(subscribers).toHaveLength(1);
    total = 20;
    for (const subscriber of [...subscribers])
      subscriber({
        getActionsFromStoreByName: () => [
          {
            result: {
              payload: "/api/ecommerce/attributes/price",
              topics: [topic],
              createdAt: new Date(Date.now() + 1).toISOString(),
            },
          },
        ],
      });
    await jest.advanceTimersByTimeAsync(200);
    expect(queryClient.getQueryData(options.queryKey)).toEqual([{ total: 20 }]);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(options.meta.screen).toBe("purchases");
    cleanup();
    stopObserving();
    expect(subscribers).toHaveLength(0);
  },
);
