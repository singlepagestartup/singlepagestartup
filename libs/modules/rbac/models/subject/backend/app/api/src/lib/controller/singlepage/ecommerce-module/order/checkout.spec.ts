/**
 * BDD Suite: rbac ecommerce order checkout controller behavior.
 *
 * Given: checkout handler dependencies are mocked for deterministic checkout execution.
 * When: subject submits checkout payload for existing cart orders.
 * Then: handler validates payload, annotates order comments, and delegates to checkout service.
 */

const orderFindByIdMock = jest.fn();
const orderUpdateMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => orderFindByIdMock(...args),
    update: (...args: unknown[]) => orderUpdateMock(...args),
  },
}));

import { Handler } from "./checkout";

function createContext(
  params: Record<string, string | undefined>,
  body: Record<string, unknown>,
) {
  return {
    req: {
      param: (name: string) => params[name],
      parseBody: jest.fn().mockResolvedValue(body),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    findById: jest.fn().mockResolvedValue({ id: "subject-1" }),
    deanonymize: jest.fn().mockResolvedValue(undefined),
    ecommerceOrderCheckout: jest.fn().mockResolvedValue({
      provider: "stripe",
      checkoutUrl: "https://example.test/pay",
    }),
  } as any;
}

describe("Given: ecommerce order checkout handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    orderFindByIdMock.mockResolvedValue({
      id: "order-1",
      comment: "",
      status: "new",
    });
    orderUpdateMock.mockResolvedValue({ id: "order-1" });
  });

  it("When: request body data is not string Then: checkout is rejected", async () => {
    const service = createService();
    const handler = new Handler(service);
    const context = createContext(
      { id: "subject-1" },
      { data: { invalid: true } },
    );

    await expect(handler.execute(context, jest.fn())).rejects.toBeTruthy();
    expect(service.ecommerceOrderCheckout).not.toHaveBeenCalled();
  });

  it("When: payload is valid Then: order comments are patched and checkout service is called", async () => {
    const service = createService();
    const handler = new Handler(service);

    const context = createContext(
      { id: "subject-1" },
      {
        data: JSON.stringify({
          provider: "stripe",
          email: "user@example.test",
          comment: "checkout note",
          ecommerceModule: {
            orders: [{ id: "order-1" }, { id: "order-2" }],
          },
        }),
      },
    );

    orderFindByIdMock.mockResolvedValueOnce({
      id: "order-1",
      comment: "",
      status: "new",
    });
    orderFindByIdMock.mockResolvedValueOnce({
      id: "order-2",
      comment: "",
      status: "new",
    });

    await handler.execute(context, jest.fn());

    expect(service.deanonymize).toHaveBeenCalledWith({
      id: "subject-1",
      email: "user@example.test",
    });
    expect(orderUpdateMock).toHaveBeenCalledTimes(2);
    expect(service.ecommerceOrderCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "subject-1",
        provider: "stripe",
        email: "user@example.test",
      }),
    );

    expect(context.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        checkoutUrl: "https://example.test/pay",
      }),
    });
  });
});
