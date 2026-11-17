/**
 * BDD Suite: add-to-cart failure feedback.
 *
 * Given: the add-to-cart mutation calls the subject order create route.
 * When: the route rejects the request, for example because the product has no price in an available currency.
 * Then: the rejection is shown to the visitor as an error toast and still propagates to react-query.
 */

const toastErrorMock = jest.fn();
const invalidateMock = jest.fn();
const ecommerceModuleOrderCreateMock = jest.fn();
const ecommerceModuleOrderUpdateMock = jest.fn();
const ecommerceModuleOrderDeleteMock = jest.fn();
const ecommerceModuleOrderSelectionMock = jest.fn();
let capturedMutationOptions: any;

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => {
    capturedMutationOptions = options;

    return options;
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: jest.fn(),
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:3000",
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    ecommerceModuleOrderCreate: (...args: unknown[]) =>
      ecommerceModuleOrderCreateMock(...args),
    ecommerceModuleOrderUpdate: (...args: unknown[]) =>
      ecommerceModuleOrderUpdateMock(...args),
    ecommerceModuleOrderDelete: (...args: unknown[]) =>
      ecommerceModuleOrderDeleteMock(...args),
    ecommerceModuleOrderSelection: (...args: unknown[]) =>
      ecommerceModuleOrderSelectionMock(...args),
  },
}));

jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {
    getState: () => ({ addAction: jest.fn() }),
  },
}));

jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: (headers: unknown) => headers,
}));

jest.mock("@paralleldrive/cuid2", () => ({
  createId: () => "request-id",
}));

jest.mock("@sps/shared-frontend-client-api", () => ({
  invalidateRouteQueries: jest.requireActual(
    "../../../../../../../../../../../shared/frontend/client/api/src/lib/cache",
  ).invalidateRouteQueries,
  queryClient: {
    invalidateQueries: (...args: unknown[]) => invalidateMock(...args),
  },
}));
import { action } from "./create";
import { action as update } from "./id/update";
import { action as remove } from "./id/delete";
import { action as selection } from "./selection";

const NO_PRICE_ERROR =
  "Validation error. Product has no price in an available currency";

describe("Given: a visitor adds a product the API refuses to put in the cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMutationOptions = undefined;
  });

  /**
   * BDD Scenario: the refusal reaches the visitor.
   *
   * Given: the create route answers with a validation error.
   * When: the add-to-cart mutation runs.
   * Then: the error message is toasted and rethrown for react-query to record.
   */
  it("When: the create route rejects Then: the message is toasted and rethrown", async () => {
    ecommerceModuleOrderCreateMock.mockRejectedValue(new Error(NO_PRICE_ERROR));

    action({});

    await expect(
      capturedMutationOptions.mutationFn({
        id: "subject-1",
        data: { productId: "product-unpriced", quantity: 1 },
      }),
    ).rejects.toThrow(NO_PRICE_ERROR);

    expect(toastErrorMock).toHaveBeenCalledWith(NO_PRICE_ERROR);
  });

  /**
   * BDD Scenario: a successful add-to-cart stays quiet.
   *
   * Given: the create route answers with the updated subject.
   * When: the add-to-cart mutation runs.
   * Then: no error toast is raised.
   */
  it("When: the create route succeeds Then: no error toast is raised", async () => {
    ecommerceModuleOrderCreateMock.mockResolvedValue({ id: "subject-1" });

    action({});

    await expect(
      capturedMutationOptions.mutationFn({
        id: "subject-1",
        data: { productId: "product-priced", quantity: 1 },
      }),
    ).resolves.toEqual({ id: "subject-1" });

    expect(toastErrorMock).not.toHaveBeenCalled();
    const { predicate } = invalidateMock.mock.calls[0][0];
    expect(
      predicate({
        queryKey: ["/api/rbac/subjects/subject-1/ecommerce-module/orders"],
      }),
    ).toBe(true);
    expect(
      predicate({
        queryKey: [
          "/api/rbac/subjects/subject-1/ecommerce-module/orders/quantity",
        ],
      }),
    ).toBe(true);
    expect(
      predicate({
        queryKey: [
          "/api/rbac/subjects/subject-2/ecommerce-module/orders/quantity",
        ],
      }),
    ).toBe(false);
  });
});

describe("cart aggregate cache reconciliation", () => {
  beforeEach(() => jest.clearAllMocks());
  it.each([
    ["create", action, ecommerceModuleOrderCreateMock],
    ["remove", remove, ecommerceModuleOrderDeleteMock],
    ["change quantity", update, ecommerceModuleOrderUpdateMock],
    ["apply offer quantity", selection, ecommerceModuleOrderSelectionMock],
  ] as const)(
    "%s reconciles both list and quantity before the consumer callback",
    async (_name, useAction, request) => {
      const result = { id: "subject-1", applied: true, orderIds: ["order"] };
      request.mockResolvedValue(result);
      const consumer = jest.fn(() => {
        expect(invalidateMock).toHaveBeenCalledTimes(1);
      });
      useAction({ reactQueryOptions: { onSuccess: consumer } });
      const value = await capturedMutationOptions.mutationFn({
        id: "subject-1",
        orderId: "order",
        data: { quantity: 2, action: "apply" },
      });
      await capturedMutationOptions.onSuccess(value, {}, undefined, {});
      expect(consumer).toHaveBeenCalledTimes(1);
      const { predicate } = invalidateMock.mock.calls[0][0];
      for (const suffix of ["orders", "orders/quantity"]) {
        expect(
          predicate({
            queryKey: [
              `/api/rbac/subjects/subject-1/ecommerce-module/${suffix}`,
            ],
          }),
        ).toBe(true);
      }
      expect(
        predicate({
          queryKey: [
            "/api/rbac/subjects/subject-2/ecommerce-module/orders/quantity",
          ],
        }),
      ).toBe(false);
    },
  );
  it("leaves seller catalog readers untouched", async () => {
    ecommerceModuleOrderCreateMock.mockResolvedValue({ id: "subject-1" });
    action();
    await capturedMutationOptions.mutationFn({ id: "subject-1", data: {} });
    const { predicate } = invalidateMock.mock.calls[0][0];
    expect(
      predicate({
        queryKey: ["/api/rbac/subjects/subject-1/ecommerce-module/stores"],
      }),
    ).toBe(false);
    expect(
      predicate({
        queryKey: ["/api/rbac/subjects/subject-1/ecommerce-module/products"],
      }),
    ).toBe(false);
  });
  it("keeps preview read-only without invalidating cart readers", async () => {
    ecommerceModuleOrderSelectionMock.mockResolvedValue({
      applied: false,
      orderIds: [],
    });
    selection();
    await capturedMutationOptions.mutationFn({
      id: "subject-1",
      orderId: "order",
      data: { action: "preview" },
    });
    expect(invalidateMock).not.toHaveBeenCalled();
  });
});
