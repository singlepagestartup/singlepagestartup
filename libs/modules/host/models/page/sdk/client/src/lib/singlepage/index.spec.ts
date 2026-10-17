const effects: Array<() => () => void> = [];
const unsubscribe = jest.fn();
const subscription = jest.fn(() => unsubscribe);
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: (effect: () => () => void) => effects.push(effect),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => options,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  factory: () => ({}),
  queryClient: {},
  subscription: (...args: unknown[]) => subscription(...args),
}));
jest.mock("@sps/host/models/page/sdk/model", () => ({
  route: "/api/host/pages",
  clientHost: "http://localhost:4000",
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {},
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));

import { api } from "./index";

it("keeps different URL resolutions in separate cache entries", () => {
  const first = api.findByUrl({ url: "/en/first" }) as any;
  const second = api.findByUrl({ url: "/en/second" }) as any;
  const filtered = api.findByUrl({
    url: "/en/first",
    params: { language: "ru" },
  }) as any;
  expect(first.queryKey).not.toEqual(second.queryKey);
  expect(first.queryKey).not.toEqual(filtered.queryKey);
});

it.each(["findByUrl", "urlSegmentValue"] as const)(
  "%s subscribes to Page changes and releases the subscription",
  (method) => {
    effects.length = 0;
    const options = api[method]({ url: "/en/page", segment: "slug" }) as any;
    expect(options.meta.topics).toEqual(["host.pages"]);
    const cleanup = effects[0]();
    expect(subscription).toHaveBeenCalledWith(
      options.queryKey[0],
      expect.anything(),
    );
    cleanup();
    expect(unsubscribe).toHaveBeenCalled();
  },
);
