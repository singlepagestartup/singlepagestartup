/**
 * BDD Suite: rbac ecommerce order checkout controller behavior.
 *
 * Given: checkout handler dependencies are mocked for deterministic checkout execution.
 * When: subject submits checkout payload for existing cart orders.
 * Then: handler validates payload, keeps only the subject's own orders, annotates their comments, and delegates to checkout service.
 */

const firstOrderId = "00000000-0000-4000-8000-000000000001";
const secondOrderId = "00000000-0000-4000-8000-000000000002";
const deletedOrderId = "00000000-0000-4000-8000-000000000003";
const foreignOrderId = "00000000-0000-4000-8000-000000000004";

const orderFindMock = jest.fn();
const orderUpdateMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
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
    find: (...args: unknown[]) => orderFindMock(...args),
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

function createService(subjectOrderIds = [firstOrderId, secondOrderId]) {
  return {
    findById: jest.fn().mockResolvedValue({ id: "subject-1" }),
    deanonymize: jest.fn().mockResolvedValue(undefined),
    subjectsToEcommerceModuleOrders: {
      find: jest.fn().mockResolvedValue(
        subjectOrderIds.map((ecommerceModuleOrderId) => ({
          subjectId: "subject-1",
          ecommerceModuleOrderId,
        })),
      ),
    },
    ecommerceOrderCheckout: jest.fn().mockResolvedValue({
      provider: "stripe",
      checkoutUrl: "https://example.test/pay",
    }),
  } as any;
}

function expectOrderLookup(orderIds: string[]) {
  expect(orderFindMock).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: orderIds,
            },
          ],
        },
      },
    }),
  );
}

describe("Given: ecommerce order checkout handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    orderFindMock.mockResolvedValue([
      {
        id: firstOrderId,
        comment: "",
        status: "new",
      },
    ]);
    orderUpdateMock.mockResolvedValue({ id: firstOrderId });
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

  it("When: an order ID is malformed Then: rejects the checkout before querying or writing", async () => {
    const service = createService();
    const context = createContext(
      { id: "subject-1" },
      {
        data: JSON.stringify({
          provider: "dummy",
          email: "owner@example.test",
          ecommerceModule: { orders: [{ id: "invalid-id" }] },
        }),
      },
    );

    await expect(
      new Handler(service).execute(context, jest.fn()),
    ).rejects.toThrow("Validation error");
    expect(service.subjectsToEcommerceModuleOrders.find).not.toHaveBeenCalled();
    expect(service.deanonymize).not.toHaveBeenCalled();
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
            orders: [{ id: firstOrderId }, { id: secondOrderId }],
          },
        }),
      },
    );

    orderFindMock.mockResolvedValueOnce([
      {
        id: firstOrderId,
        comment: "",
        status: "new",
      },
      {
        id: secondOrderId,
        comment: "",
        status: "new",
      },
    ]);

    await handler.execute(context, jest.fn());

    expect(service.deanonymize).toHaveBeenCalledWith({
      id: "subject-1",
      email: "user@example.test",
    });
    expect(service.subjectsToEcommerceModuleOrders.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: "subject-1",
            },
            {
              column: "ecommerceModuleOrderId",
              method: "inArray",
              value: [firstOrderId, secondOrderId],
            },
          ],
        },
      },
    });
    expectOrderLookup([firstOrderId, secondOrderId]);
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

  /**
   * BDD Scenario
   *
   * Given: the checkout form still contains an id of an order deleted from the cart.
   * When: the checkout request is handled.
   * Then: only existing orders are updated and passed to the checkout service.
   */
  it("When: payload contains a deleted order id Then: stale order ids are ignored", async () => {
    const service = createService([firstOrderId, deletedOrderId]);
    const handler = new Handler(service);
    const context = createContext(
      { id: "subject-1" },
      {
        data: JSON.stringify({
          provider: "stripe",
          email: "user@example.test",
          comment: "checkout note",
          ecommerceModule: {
            orders: [{ id: firstOrderId }, { id: deletedOrderId }],
          },
        }),
      },
    );

    orderFindMock.mockResolvedValueOnce([
      {
        id: firstOrderId,
        comment: "",
        status: "new",
      },
    ]);

    await handler.execute(context, jest.fn());

    expectOrderLookup([firstOrderId, deletedOrderId]);
    expect(orderUpdateMock).toHaveBeenCalledTimes(1);
    expect(service.ecommerceOrderCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        ecommerceModule: {
          orders: [{ id: firstOrderId }],
        },
      }),
    );
  });

  /**
   * BDD Scenario
   *
   * Given: the checkout payload names the subject's cart order and an order linked to another subject.
   * When: the checkout request is handled.
   * Then: only the subject's own order is looked up, annotated and passed to the checkout service.
   */
  it("When: payload contains an order of another subject Then: that order is neither annotated nor checked out", async () => {
    const service = createService([firstOrderId]);
    const handler = new Handler(service);
    const context = createContext(
      { id: "subject-1" },
      {
        data: JSON.stringify({
          provider: "stripe",
          email: "user@example.test",
          comment: "checkout note",
          ecommerceModule: {
            orders: [{ id: firstOrderId }, { id: foreignOrderId }],
          },
        }),
      },
    );

    await handler.execute(context, jest.fn());

    expectOrderLookup([firstOrderId]);
    expect(orderUpdateMock).toHaveBeenCalledTimes(1);
    expect(orderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: firstOrderId,
        data: { comment: "checkout note" },
      }),
    );
    expect(service.ecommerceOrderCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        ecommerceModule: {
          orders: [{ id: firstOrderId }],
        },
      }),
    );
  });

  /**
   * BDD Scenario
   *
   * Given: every order in the checkout payload is linked to another subject.
   * When: the checkout request is handled.
   * Then: it is rejected as not found before any order is read, annotated or checked out.
   */
  it("When: payload contains only orders of another subject Then: checkout is rejected before any order is touched", async () => {
    const service = createService([]);
    const handler = new Handler(service);
    const context = createContext(
      { id: "subject-1" },
      {
        data: JSON.stringify({
          provider: "stripe",
          email: "user@example.test",
          ecommerceModule: {
            orders: [{ id: foreignOrderId }],
          },
        }),
      },
    );

    await expect(handler.execute(context, jest.fn())).rejects.toThrow(
      "No ecommerce module orders found",
    );
    expect(orderFindMock).not.toHaveBeenCalled();
    expect(service.deanonymize).not.toHaveBeenCalled();
    expect(orderUpdateMock).not.toHaveBeenCalled();
    expect(service.ecommerceOrderCheckout).not.toHaveBeenCalled();
  });
});
