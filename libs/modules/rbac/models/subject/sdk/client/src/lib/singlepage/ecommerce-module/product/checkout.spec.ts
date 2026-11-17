const mockCheckout = jest.fn();
const mockInvalidate = jest.fn();
const mockAction = jest.fn();
let options: any;
jest.mock("@tanstack/react-query", () => ({
  useMutation: (value: unknown) => {
    options = value;
    return value;
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "https://api.example",
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    ecommerceModuleProductCheckout: (value: unknown) => mockCheckout(value),
  },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({ Authorization: "Bearer owner" }),
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  queryClient: {},
  invalidateRouteQueries: (...args: unknown[]) => mockInvalidate(...args),
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction: mockAction }) },
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
import { action } from "./checkout";
beforeEach(() => {
  jest.clearAllMocks();
  mockInvalidate.mockReset().mockResolvedValue(undefined);
});

it("submits the exact configured item once, reconciles its owner's cart and preserves consumer success", async () => {
  const result = {
    billingModule: {
      invoices: [{ id: "invoice", paymentUrl: "https://pay.example" }],
    },
  };
  mockCheckout.mockResolvedValue(result);
  const onSuccess = jest.fn();
  action({ reactQueryOptions: { onSuccess } });
  expect(options.onSuccess).toBe(onSuccess);
  const variables = {
    id: "owner",
    productId: "product",
    data: {
      provider: "dummy",
      email: "receipt@example.com",
      offerId: "offer",
      quantity: 2,
      billingModule: { currency: { id: "rub" } },
      destination: { address: "Private address" },
      services: [{ offerId: "service", quantity: 1 }],
      expectedQuoteVersion: "terms",
      comment: "Comment",
    },
  };
  expect(await options.mutationFn(variables)).toEqual(result);
  await options.onSuccess(result, variables, undefined, undefined);
  expect(mockCheckout).toHaveBeenCalledTimes(1);
  expect(mockCheckout).toHaveBeenCalledWith({
    ...variables,
    host: "https://api.example",
    options: { headers: { Authorization: "Bearer owner" } },
  });
  expect(mockInvalidate).toHaveBeenCalledWith(
    {},
    "/api/rbac/subjects/owner/ecommerce-module/orders",
  );
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
  expect(mockAction).toHaveBeenCalledWith(
    expect.objectContaining({
      props: { id: "owner" },
      result: { invoiceIds: ["invoice"] },
    }),
  );
  expect(JSON.stringify(mockAction.mock.calls)).not.toContain(
    "Private address",
  );
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

it("reconciles a partially completed checkout on rejection while preserving the original error", async () => {
  const failure = new Error("Provider response lost after order creation");
  mockCheckout.mockRejectedValue(failure);
  mockInvalidate.mockRejectedValue(new Error("Refresh unavailable"));
  action({});
  await expect(
    options.mutationFn({
      id: "owner",
      productId: "product",
      data: { provider: "dummy" },
    }),
  ).rejects.toBe(failure);
  expect(mockCheckout).toHaveBeenCalledTimes(1);
  expect(mockInvalidate).toHaveBeenCalledWith(
    {},
    "/api/rbac/subjects/owner/ecommerce-module/orders",
  );
  expect(mockAction).not.toHaveBeenCalled();
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
});

it("returns a successful checkout and emits consistency fallback even when local cart refresh fails", async () => {
  const result = {
    billingModule: {
      invoices: [{ id: "invoice", paymentUrl: "https://pay.example" }],
    },
  };
  mockCheckout.mockResolvedValue(result);
  mockInvalidate.mockRejectedValue(new Error("Refresh failed"));
  action({});
  await expect(
    options.mutationFn({
      id: "owner",
      productId: "product",
      data: { provider: "dummy" },
    }),
  ).resolves.toBe(result);
  expect(mockCheckout).toHaveBeenCalledTimes(1);
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
  expect(mockAction).toHaveBeenCalledTimes(1);
});
