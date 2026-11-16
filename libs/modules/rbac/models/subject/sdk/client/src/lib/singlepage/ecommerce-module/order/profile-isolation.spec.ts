import { QueryClient } from "@tanstack/react-query";
let activeProfile = "A";
const orderList = jest.fn();
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: () => undefined,
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: unknown) => options,
}));
jest.mock("../../social-module/profile/active-selection", () => ({
  useActiveSocialModuleProfile: () => ({
    socialModuleProfileId: activeProfile,
    isSuccess: true,
  }),
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { ecommerceModuleOrderList: (...args: unknown[]) => orderList(...args) },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({}),
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction: jest.fn() }) },
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));
jest.mock("@sps/shared-frontend-client-api", () => ({
  consistencyQueryKey: jest.requireActual(
    "../../../../../../../../../../../shared/frontend/client/api/src/lib/consistency",
  ).consistencyQueryKey,
  queryClient: {},
  subscription: jest.fn(),
}));
import { action } from "./list";

it("keeps an A response in cache A after switching to B and restores A from its own cache", async () => {
  const cache = new QueryClient();
  let finishA!: (value: unknown) => void;
  orderList.mockImplementation((props) =>
    props.params.socialModuleProfileId === "A"
      ? new Promise((resolve) => {
          finishA = resolve;
        })
      : Promise.resolve([{ id: "order-B" }]),
  );
  const a = action({
    id: "owner",
    params: { includePurchaseDetails: true },
  }) as any;
  const pendingA = cache.fetchQuery(a);
  activeProfile = "B";
  const b = action({
    id: "owner",
    params: { includePurchaseDetails: true },
  }) as any;
  await cache.fetchQuery(b);
  finishA([{ id: "order-A" }]);
  await pendingA;
  expect(a.queryKey).not.toEqual(b.queryKey);
  expect(cache.getQueryData(b.queryKey)).toEqual([{ id: "order-B" }]);
  activeProfile = "A";
  const restored = action({
    id: "owner",
    params: { includePurchaseDetails: true },
  }) as any;
  expect(cache.getQueryData(restored.queryKey)).toEqual([{ id: "order-A" }]);
  expect(orderList).toHaveBeenCalledWith(
    expect.objectContaining({
      params: { includePurchaseDetails: true, socialModuleProfileId: "A" },
    }),
  );
  cache.clear();
});
