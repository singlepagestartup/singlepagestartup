/**
 * BDD Suite: rbac ecommerce order delete controller behavior.
 *
 * Given: delete handler dependencies are mocked with a mutable cart order.
 * When: subject deletes cart order.
 * Then: unauthorized requests receive 401 and authorized requests remove order relations and order itself.
 */

const authorizationMock = jest.fn();
const verifyMock = jest.fn();
const orderDeleteMock = jest.fn();
const ordersToProductsDeleteMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  authorization: (...args: unknown[]) => authorizationMock(...args),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("hono/jwt", () => ({
  verify: (...args: unknown[]) => verifyMock(...args),
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => orderDeleteMock(...args),
  },
}));

jest.mock("@sps/ecommerce/relations/orders-to-products/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => ordersToProductsDeleteMock(...args),
  },
}));

import { Handler } from "./delete";

function createContext(params: Record<string, string | undefined>) {
  return {
    req: {
      param: (name: string) => params[name],
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    findById: jest.fn().mockResolvedValue({ id: "subject-1" }),
    ecommerceModule: {
      order: {
        findById: jest.fn().mockResolvedValue({
          id: "order-1",
          status: "new",
        }),
      },
      ordersToProducts: {
        find: jest.fn().mockResolvedValue([
          { id: "otp-1", orderId: "order-1" },
          { id: "otp-2", orderId: "order-1" },
        ]),
      },
    },
  } as any;
}

describe("Given: ecommerce order delete handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
    ordersToProductsDeleteMock.mockResolvedValue({});
    orderDeleteMock.mockResolvedValue({});
  });

  it("When: auth token is missing Then: response is 401 with null data", async () => {
    authorizationMock.mockReturnValue(undefined);

    const handler = new Handler(createService());
    const context = createContext({ id: "subject-1", orderId: "order-1" });

    await handler.execute(context, jest.fn());

    expect(context.json).toHaveBeenCalledWith(
      { data: null },
      {
        status: 401,
      },
    );
    expect(orderDeleteMock).not.toHaveBeenCalled();
  });

  it("When: owner deletes a new order Then: order relations and order are deleted", async () => {
    const handler = new Handler(createService());
    const context = createContext({ id: "subject-1", orderId: "order-1" });

    await handler.execute(context, jest.fn());

    expect(ordersToProductsDeleteMock).toHaveBeenCalledTimes(2);
    expect(orderDeleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "order-1" }),
    );
    expect(context.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "subject-1" }),
    });
  });
});
