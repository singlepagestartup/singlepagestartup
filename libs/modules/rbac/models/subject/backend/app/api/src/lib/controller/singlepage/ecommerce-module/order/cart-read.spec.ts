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
  ...jest.requireActual("@sps/backend-utils"),
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

import { Service as OrderPurchaseDetails } from "../../../../service/startup/ecommerce/order/purchase-details";
import type { IExecuteProps as IPurchaseDetailsProps } from "../../../../service/singlepage/ecommerce/order/purchase-details";
import { Handler as ListHandler } from "./list";
import { Handler as QuantityHandler } from "./quantity";
import { Handler as TotalHandler } from "./total";

function createContext(params?: unknown) {
  return {
    get: () => {
      if (!params) return params;
      const { includePurchaseDetails, includeCartDetails, ...parsed } =
        params as Record<string, unknown>;
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
      ecommerceModuleOrderPurchaseDetails(props: IPurchaseDetailsProps) {
        return new OrderPurchaseDetails({ service: this }).execute(props);
      },
      ecommerceModuleOrderPurchasePayments: jest
        .fn()
        .mockResolvedValue({ retryableIds: new Set(), paymentUrls: new Map() }),
      module: {
        subjectsToEcommerceModuleOrders: {
          find: jest
            .fn()
            .mockResolvedValue([{ ecommerceModuleOrderId: "order-1" }]),
        },
      },
      modules: {
        ecommerce: {
          order: {
            find: orderFind,
            findByIdQuantity: jest.fn(),
            findByIdTotal: jest.fn(),
            ordersToBillingModulePaymentIntents: {
              find: jest.fn().mockResolvedValue([]),
            },
          },
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
    service.module.subjectsToEcommerceModuleOrders.find.mockResolvedValue([]);
    expect(
      await new ListHandler(service).execute(createContext(), jest.fn()),
    ).toEqual({ data: [] });
    expect(orderFind).not.toHaveBeenCalled();
  });

  it("exposes the existing invoice to the paying order owner without looking up receipt files", async () => {
    const { service, orderFind } = createService();
    const order = { id: "order-1", type: "history", status: "paying" };
    orderFind.mockResolvedValue([order, { id: "foreign" }]);
    const paymentUrl = "https://checkout.example/invoice-1";
    service.ecommerceModuleOrderPurchasePayments.mockResolvedValue({
      retryableIds: new Set([order.id]),
      paymentUrls: new Map([[order.id, paymentUrl]]),
    });
    service.modules.ecommerce.order.findByIdTotal.mockResolvedValue({
      totals: [],
      unpriced: [],
    });
    const result = await new ListHandler(service).execute(
      createContext({
        includePurchaseDetails: "true",
        filters: { and: [{ column: "type", method: "eq", value: "history" }] },
      }),
      jest.fn(),
    );
    expect(service.ecommerceModuleOrderPurchasePayments).toHaveBeenCalledWith({
      subjectId: "subject-1",
      orders: [order],
    });
    expect(result).toEqual({
      data: [
        {
          ...order,
          purchaseDetails: {
            canRepeatPayment: true,
            paymentUrl,
            totals: [],
            receipts: [],
          },
        },
      ],
    });
  });
  it("enriches only owned purchases with zero totals and protected receipt routes", async () => {
    const { service, orderFind } = createService();
    orderFind.mockResolvedValue([
      { id: "order-1", type: "history", status: "paid" },
      { id: "foreign-order" },
    ]);
    const totals = [
      {
        total: 0,
        billingModuleCurrency: { id: "usd", slug: "usd", symbol: "$" },
      },
    ];
    service.modules.ecommerce.order.findByIdTotal.mockResolvedValue({
      totals,
      unpriced: [],
    });
    const protectedReceipts = [
      { id: "private-receipt", path: "/private-artifact" },
    ];
    service.orderWork = {
      publishedReceipts: jest.fn().mockResolvedValue(protectedReceipts),
    };
    const result = await new ListHandler(service).execute(
      createContext({
        includePurchaseDetails: "true",
        filters: { and: [{ column: "type", method: "eq", value: "history" }] },
      }),
      jest.fn(),
    );
    expect(service.modules.ecommerce.order.findByIdTotal).toHaveBeenCalledTimes(
      1,
    );
    expect(service.modules.ecommerce.order.findByIdTotal).toHaveBeenCalledWith({
      id: "order-1",
    });
    expect(service.orderWork.publishedReceipts).toHaveBeenCalledTimes(1);
    expect(service.orderWork.publishedReceipts).toHaveBeenCalledWith(
      "subject-1",
      "order-1",
    );
    expect(result).toEqual({
      data: [
        {
          id: "order-1",
          type: "history",
          status: "paid",
          purchaseDetails: {
            canRepeatPayment: false,
            totals,
            receipts: [],
            protectedReceipts,
          },
        },
      ],
    });
  });

  it("returns saved order line IDs for each charge and resolves the first product slug", async () => {
    const { service, orderFind } = createService();
    orderFind.mockResolvedValue([
      { id: "order-1", type: "history", status: "paid" },
    ]);
    const charges = [
      {
        orderLineId: "delivery",
        parentLineId: "chair",
        charge: { role: "delivery", productId: "delivery-product" },
      },
      {
        orderLineId: "chair",
        parentLineId: null,
        charge: { role: "product", productId: "chair-product" },
      },
      {
        orderLineId: "table",
        parentLineId: null,
        charge: { role: "product", productId: "table-product" },
      },
    ];
    service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
      charges.map(({ orderLineId, ...purchaseSnapshot }) => ({
        orderId: "order-1",
        billingModulePaymentIntentId: "intent",
        orderLineId,
        purchaseSnapshot: {
          ...purchaseSnapshot,
          currencyId: "rub",
          amount: "10.00",
        },
      })),
    );
    service.modules.ecommerce.product = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: "chair-product", slug: "birch-chair" }]),
    };
    service.modules.ecommerce.ordersToFileStorageModuleFiles = {
      find: jest.fn().mockResolvedValue([]),
    };
    service.modules.ecommerce.order.paymentIntent = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: "intent", status: "succeeded" }]),
    };
    service.modules.billing = {
      paymentIntentsToInvoices: {
        find: jest
          .fn()
          .mockResolvedValue([
            { paymentIntentId: "intent", invoiceId: "invoice" },
          ]),
      },
      paymentIntentsToCurrencies: {
        find: jest
          .fn()
          .mockResolvedValue([
            { paymentIntentId: "intent", currencyId: "rub" },
          ]),
      },
      invoice: {
        find: jest.fn().mockResolvedValue([{ id: "invoice", status: "paid" }]),
      },
      currency: { find: jest.fn().mockResolvedValue([{ id: "rub" }]) },
    };

    const result = await new ListHandler(service).execute(
      createContext({
        includePurchaseDetails: "true",
        filters: { and: [{ column: "type", method: "eq", value: "history" }] },
      }),
      jest.fn(),
    );

    expect(service.modules.ecommerce.product.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [{ column: "id", method: "inArray", value: ["chair-product"] }],
        },
      },
    });
    expect(result).toMatchObject({
      data: [
        { purchaseDetails: { primaryProductSlug: "birch-chair", charges } },
      ],
    });
  });
});

describe("Private cart projection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
  });
  it("expands only the caller's active orders, even with broad OR filters", async () => {
    const { service, orderFind } = createService();
    orderFind.mockResolvedValue([
      { id: "order-1", type: "cart", status: "new" },
      { id: "foreign", type: "cart", status: "new" },
      { id: "old", type: "history", status: "paid" },
    ]);
    service.module.subjectsToEcommerceModuleOrders.find.mockResolvedValue([
      { ecommerceModuleOrderId: "order-1" },
      { ecommerceModuleOrderId: "old" },
    ]);
    service.ecommerceModuleOrderCartDetails = jest.fn().mockResolvedValue({
      lines: [{ id: "my-line", productId: "product", quantity: 2 }],
      totals: [{ total: 250 }],
      storeIds: ["store"],
    });
    service.modules.ecommerce.storesToOrders = {
      find: jest.fn().mockResolvedValue([{ storeId: "store" }]),
    };
    const result = await new ListHandler(service).execute(
      createContext({
        includeCartDetails: "true",
        filters: { or: [{ column: "status", method: "eq", value: "paid" }] },
      }),
      jest.fn(),
    );
    expect(result).toEqual({
      data: [
        {
          id: "order-1",
          type: "cart",
          status: "new",
          cartDetails: {
            lines: [{ id: "my-line", productId: "product", quantity: 2 }],
            totals: [{ total: 250 }],
            storeIds: ["store"],
          },
        },
      ],
    });
    expect(service.ecommerceModuleOrderCartDetails).toHaveBeenCalledTimes(1);
    expect(service.ecommerceModuleOrderCartDetails).toHaveBeenCalledWith({
      subjectId: "subject-1",
      orderId: "order-1",
    });
  });
  it("rejects a token for a different subject before reading data", async () => {
    const { service } = createService();
    verifyMock.mockResolvedValue({ subject: { id: "other" } });
    await expect(
      new ListHandler(service).execute(
        createContext({ includeCartDetails: "true" }),
        jest.fn(),
      ),
    ).rejects.toThrow();
    expect(
      service.module.subjectsToEcommerceModuleOrders.find,
    ).not.toHaveBeenCalled();
  });
});

describe("Empty cart total response", () => {
  beforeEach(() => {
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
  });
  it.each([false, true])(
    "keeps the total envelope when subject order links exist: %s",
    async (hasLinks) => {
      const { service } = createService();
      service.module.subjectsToEcommerceModuleOrders.find.mockResolvedValue(
        hasLinks ? [{ ecommerceModuleOrderId: "order-1" }] : [],
      );
      expect(
        await new TotalHandler(service).execute(createContext(), jest.fn()),
      ).toEqual({ data: [], unpriced: [] });
    },
  );
});
