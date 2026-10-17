const mockUseQuery = jest.fn((options) => options);
const mockOrderList = jest.fn().mockResolvedValue([]);
jest.mock("react", () => ({ useEffect: jest.fn() }));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    ecommerceModuleOrderList: (...args: unknown[]) => mockOrderList(...args),
  },
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {},
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: jest.fn() }));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({}),
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  consistencyQueryKey: jest.requireActual(
    "../../../../../../../../../../../shared/frontend/client/api/src/lib/consistency",
  ).consistencyQueryKey,
  queryClient: {},
  subscription: jest.fn(),
}));
import { action } from "./list";

describe("Subject order collection cache", () => {
  beforeEach(() => jest.clearAllMocks());
  it("keeps cart and paid history queries in different cache entries", () => {
    action({ id: "subject" });
    action({
      id: "subject",
      params: {
        filters: { and: [{ column: "type", method: "eq", value: "history" }] },
      },
    });
    const [cart, history] = mockUseQuery.mock.calls.map(([options]) => options);
    expect(cart.queryKey).toEqual([
      "/api/rbac/subjects/subject/ecommerce-module/orders",
      undefined,
      { principal: "", host: "http://localhost:4000" },
    ]);
    expect(history.queryKey).not.toEqual(cart.queryKey);
  });
  it("preserves order invalidation when the caller supplies other topics", () => {
    action({
      id: "subject",
      reactQueryOptions: {
        meta: { topics: ["billing.payment-intents"], source: "purchases" },
      },
    });
    expect(mockUseQuery.mock.calls[0][0].meta).toEqual({
      topics: ["ecommerce.orders", "billing.payment-intents"],
      source: "purchases",
    });
  });
});
