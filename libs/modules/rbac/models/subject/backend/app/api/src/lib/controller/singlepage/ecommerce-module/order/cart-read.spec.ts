jest.mock("@sps/shared-backend-api", () => ({
  withConsistencySnapshot: async (operation: () => Promise<unknown>) =>
    operation(),
}));
/**
 * BDD Suite: active cart read controllers.
 *
 * Given: a subject owns orders that may already have progressed past the new state.
 * When: cart list, quantity, and total endpoints load the subject's active cart.
 * Then: every order query is restricted to type cart and status new.
 */

const authorizationMock = jest.fn();
const verifyMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
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

import { Handler as ListHandler } from "./list";
import { Handler as QuantityHandler } from "./quantity";
import { Handler as TotalHandler } from "./total";

function createContext(params?: unknown) {
  return {
    get: () => {
      if (!params) return params;
      const { includePurchaseDetails, ...parsed } = params as Record<
        string,
        unknown
      >;
      return parsed;
    },
    req: {
      param: (name: string) => (name === "id" ? "subject-1" : undefined),
      query: (name: string) =>
        (params as Record<string, unknown> | undefined)?.[name],
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  const orderFind = jest.fn().mockResolvedValue([]);

  return {
    orderFind,
    service: {
      subjectsToEcommerceModuleOrders: {
        find: jest
          .fn()
          .mockResolvedValue([{ ecommerceModuleOrderId: "order-1" }]),
      },
      ecommerceModule: {
        order: {
          find: orderFind,
          findByIdQuantity: jest.fn(),
          findByIdTotal: jest.fn(),
        },
      },
    } as any,
  };
}

function expectActiveCartFilters(orderFind: jest.Mock) {
  expect(orderFind).toHaveBeenCalledWith({
    params: {
      filters: {
        and: expect.arrayContaining([
          {
            column: "type",
            method: "eq",
            value: "cart",
          },
          {
            column: "status",
            method: "eq",
            value: "new",
          },
        ]),
      },
    },
  });
}

describe("Given: an authenticated subject with historical cart orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
  });

  /**
   * BDD Scenario: list only active cart orders.
   *
   * Given: subject-to-order relations exist.
   * When: the cart list endpoint executes.
   * Then: the repository query includes status new.
   */
  it("When: cart list is requested Then: only new cart orders are queried", async () => {
    const { orderFind, service } = createService();

    await new ListHandler(service).execute(createContext(), jest.fn());

    expectActiveCartFilters(orderFind);
  });

  /**
   * BDD Scenario: count only active cart orders.
   *
   * Given: subject-to-order relations exist.
   * When: the cart quantity endpoint executes.
   * Then: the repository query includes status new.
   */
  it("When: cart quantity is requested Then: only new cart orders are queried", async () => {
    const { orderFind, service } = createService();

    await new QuantityHandler(service).execute(createContext(), jest.fn());

    expectActiveCartFilters(orderFind);
  });

  /**
   * BDD Scenario: total only active cart orders.
   *
   * Given: subject-to-order relations exist.
   * When: the cart total endpoint executes.
   * Then: the repository query includes status new.
   */
  it("When: cart total is requested Then: only new cart orders are queried", async () => {
    const { orderFind, service } = createService();

    await new TotalHandler(service).execute(createContext(), jest.fn());

    expectActiveCartFilters(orderFind);
  });
});

describe("Subject order history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
  });

  it("returns paid history through the collection endpoint while preserving ownership", async () => {
    const { service, orderFind } = createService();
    orderFind.mockResolvedValue([
      { id: "order-1", type: "history", status: "paid" },
    ]);
    const filters = [
      { column: "type", method: "eq", value: "history" },
      { column: "status", method: "inArray", value: ["paid", "completed"] },
    ];
    const result = await new ListHandler(service).execute(
      createContext({ filters: { and: filters } }),
      jest.fn(),
    );
    expect(orderFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: ["order-1"] },
            ...filters,
          ],
        },
      },
    });
    expect(result).toEqual({
      data: [{ id: "order-1", type: "history", status: "paid" }],
    });
  });

  it("does not return another subject's order if an OR query widens the repository result", async () => {
    const { service, orderFind } = createService();
    orderFind.mockResolvedValue([{ id: "order-1" }, { id: "foreign-order" }]);
    const result = await new ListHandler(service).execute(
      createContext({
        filters: { or: [{ column: "status", method: "eq", value: "paid" }] },
      }),
      jest.fn(),
    );
    expect(result).toEqual({ data: [{ id: "order-1" }] });
  });

  it("rejects a request for another subject's collection", async () => {
    const { service, orderFind } = createService();
    verifyMock.mockResolvedValue({ subject: { id: "subject-2" } });
    await expect(
      new ListHandler(service).execute(createContext(), jest.fn()),
    ).rejects.toThrow("Only order owner can read orders");
    expect(orderFind).not.toHaveBeenCalled();
  });

  it("returns an empty list without querying orders when the subject has no links", async () => {
    const { service, orderFind } = createService();
    service.subjectsToEcommerceModuleOrders.find.mockResolvedValue([]);
    expect(
      await new ListHandler(service).execute(createContext(), jest.fn()),
    ).toEqual({ data: [] });
    expect(orderFind).not.toHaveBeenCalled();
  });

  it("enriches only owned purchases with zero totals and linked receipt files", async () => {
    const { service, orderFind } = createService();
    orderFind.mockResolvedValue([
      { id: "order-1", type: "history" },
      { id: "foreign-order" },
    ]);
    const totals = [
      {
        total: 0,
        billingModuleCurrency: { id: "usd", slug: "usd", symbol: "$" },
      },
    ];
    service.ecommerceModule.order.findByIdTotal.mockResolvedValue(totals);
    service.ecommerceModule.ordersToFileStorageModuleFiles = {
      find: jest
        .fn()
        .mockResolvedValue([{ fileStorageModuleFileId: "receipt" }]),
    };
    service.fileStorageModule = {
      file: {
        find: jest
          .fn()
          .mockResolvedValue([
            { id: "receipt", file: "/receipt.pdf" },
            { id: "foreign-file" },
          ]),
      },
    };
    const result = await new ListHandler(service).execute(
      createContext({
        includePurchaseDetails: "true",
        filters: { and: [{ column: "type", method: "eq", value: "history" }] },
      }),
      jest.fn(),
    );
    expect(service.ecommerceModule.order.findByIdTotal).toHaveBeenCalledTimes(
      1,
    );
    expect(service.ecommerceModule.order.findByIdTotal).toHaveBeenCalledWith({
      id: "order-1",
    });
    expect(
      service.ecommerceModule.ordersToFileStorageModuleFiles.find,
    ).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "orderId", method: "eq", value: "order-1" },
            { column: "variant", method: "eq", value: "receipt-default" },
          ],
        },
      },
    });
    expect(result).toEqual({
      data: [
        {
          id: "order-1",
          type: "history",
          purchaseDetails: {
            totals,
            receipts: [{ id: "receipt", file: "/receipt.pdf" }],
          },
        },
      ],
    });
  });
});
