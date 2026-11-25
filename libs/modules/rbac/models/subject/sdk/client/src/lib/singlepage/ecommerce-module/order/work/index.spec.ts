/** @jest-environment jsdom */
import { renderHook } from "@testing-library/react";
import { orderWork } from "./index";

const mockQuery = jest.fn();
const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn(
  (_path: string, _client: object) => mockUnsubscribe,
);

jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => mockQuery(options),
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { orderWork: { read: jest.fn() } },
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  queryClient: {},
  subscription: (path: string, client: object) => mockSubscribe(path, client),
}));

it("subscribes the scoped order query and polls until delivery", () => {
  const { unmount } = renderHook(() =>
    orderWork.read({
      id: "buyer",
      orderId: "order",
      taskId: "task",
      storeId: "store",
    }),
  );
  const [options] = mockQuery.mock.lastCall!;
  const path = "/api/rbac/subjects/buyer/ecommerce-module/orders/order/work";
  expect(options.queryKey).toEqual([path, "task", "store"]);
  expect(options.meta.topics).toEqual(["ecommerce.orders"]);
  expect(mockSubscribe).toHaveBeenCalledWith(path, expect.any(Object));
  expect(options.refetchInterval({ state: { data: { state: "paid" } } })).toBe(
    3000,
  );
  expect(
    options.refetchInterval({ state: { data: { state: "delivered" } } }),
  ).toBe(false);
  expect(
    options.refetchInterval({
      state: { data: { state: "paid" }, error: { status: 403 } },
    }),
  ).toBe(false);

  unmount();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});
