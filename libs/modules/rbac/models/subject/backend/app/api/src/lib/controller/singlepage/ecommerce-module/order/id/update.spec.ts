/**
 * BDD Suite: rbac ecommerce order update controller behavior.
 *
 * Given: update handler dependencies are mocked with deterministic order state.
 * When: subject updates cart order lines.
 * Then: owner checks are enforced and update API receives only the submitted order lines.
 */

const authorizationMock = jest.fn();
const verifyMock = jest.fn();
const orderUpdateMock = jest.fn();

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
    update: (...args: unknown[]) => orderUpdateMock(...args),
  },
}));

import { Handler } from "./update";

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
    ecommerceModule: {
      order: {
        findById: jest.fn().mockResolvedValue({
          id: "order-1",
          status: "new",
        }),
      },
    },
  } as any;
}

describe("Given: ecommerce order update handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
    orderUpdateMock.mockResolvedValue({ id: "order-1" });
  });

  it("When: request subject does not own order Then: update is rejected", async () => {
    verifyMock.mockResolvedValue({ subject: { id: "another-subject" } });

    const handler = new Handler(createService());
    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      {
        data: JSON.stringify({
          ordersToProducts: [{ id: "otp-1", quantity: 3 }],
        }),
      },
    );

    await expect(handler.execute(context, jest.fn())).rejects.toBeTruthy();
    expect(orderUpdateMock).not.toHaveBeenCalled();
  });

  it("When: request is valid Then: order update API is called and subject is returned", async () => {
    const handler = new Handler(createService());
    const updatePayload = {
      ordersToProducts: [{ id: "otp-1", quantity: 3 }],
    };

    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      { data: JSON.stringify(updatePayload) },
    );

    await handler.execute(context, jest.fn());

    expect(orderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "order-1",
        data: updatePayload,
      }),
    );
    expect(context.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "subject-1" }),
    });
  });

  /**
   * BDD Scenario
   *
   * Given: the request data carries order fields beside the order lines.
   * When: the subject submits the cart update.
   * Then: the update API receives the order lines only.
   */
  it("When: data carries order fields beside the lines Then: only the lines reach the update API", async () => {
    const handler = new Handler(createService());
    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      {
        data: JSON.stringify({
          ordersToProducts: [{ id: "otp-1", quantity: 3 }],
          status: "approving",
          type: "history",
          comment: "set through the cart",
        }),
      },
    );

    await handler.execute(context, jest.fn());

    expect(orderUpdateMock).toHaveBeenCalledTimes(1);
    expect(orderUpdateMock.mock.calls[0][0].data).toEqual({
      ordersToProducts: [{ id: "otp-1", quantity: 3 }],
    });
  });

  /**
   * BDD Scenario
   *
   * Given: an order line carries fields besides its id and quantity.
   * When: the subject submits the cart update.
   * Then: the update API receives each line as its id and quantity.
   */
  it("When: a line carries extra fields Then: the line reaches the update API as id and quantity", async () => {
    const handler = new Handler(createService());
    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      {
        data: JSON.stringify({
          ordersToProducts: [
            { id: "otp-1", quantity: 2, orderId: "order-2", productId: "p-2" },
          ],
        }),
      },
    );

    await handler.execute(context, jest.fn());

    expect(orderUpdateMock.mock.calls[0][0].data).toEqual({
      ordersToProducts: [{ id: "otp-1", quantity: 2 }],
    });
  });

  /**
   * BDD Scenario
   *
   * Given: the request data carries ordersToProducts that is not a list.
   * When: the subject submits the cart update.
   * Then: the update is rejected before the update API is called.
   */
  it("When: ordersToProducts is not a list Then: update is rejected", async () => {
    const handler = new Handler(createService());
    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      {
        data: JSON.stringify({
          ordersToProducts: { id: "otp-1", quantity: 3 },
        }),
      },
    );

    await expect(handler.execute(context, jest.fn())).rejects.toThrow(
      "No ordersToProducts provided",
    );
    expect(orderUpdateMock).not.toHaveBeenCalled();
  });
});
