/**
 * BDD Suite: per-order cart total controller behavior.
 *
 * Given: a subject asks for the total of one order by id.
 * When: the per-order total route executes.
 * Then: the owner receives the order total with its unpriced lines, and anyone else is refused before the total is computed.
 */

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("hono/http-exception", () => ({
  HTTPException: class HTTPException extends Error {
    status: number;

    constructor(status: number, options: { message: string }) {
      super(options.message);
      this.status = status;
    }
  },
}));

import { Handler } from "./total";

const SUBJECT_ID = "subject-1";
const ORDER_ID = "order-1";
const CURRENCY_ID = "currency-1";
const NOT_OWNED_ERROR = "Permission error. Only order owner can read order";

const ORDER = {
  id: ORDER_ID,
  type: "cart",
  status: "new",
};

const UNPRICED_LINE = {
  ordersToProductsId: "otp-2",
  productId: "product-2",
};

function createContext(params?: Record<string, string | undefined>) {
  const resolvedParams = params ?? { id: SUBJECT_ID, orderId: ORDER_ID };

  return {
    req: {
      param: (name: string) => resolvedParams[name],
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(props?: {
  order?: unknown;
  ownsOrder?: boolean;
  totals?: { total: number; billingModuleCurrency: { id: string } }[];
  unpriced?: unknown[];
}) {
  const order = props?.order === undefined ? ORDER : props.order;
  const ownsOrder = props?.ownsOrder ?? true;
  const totals = props?.totals ?? [
    {
      total: 200,
      billingModuleCurrency: { id: CURRENCY_ID },
    },
  ];
  const unpriced = props?.unpriced ?? [UNPRICED_LINE];

  const findByIdTotal = jest.fn().mockResolvedValue({ totals, unpriced });

  return {
    findByIdTotal,
    service: {
      ecommerceModuleAssertSubjectOwnsOrder: jest.fn(async () => {
        if (!ownsOrder) {
          throw new Error(NOT_OWNED_ERROR);
        }
      }),
      ecommerceModule: {
        order: {
          findById: jest.fn().mockResolvedValue(order),
          findByIdTotal,
        },
      },
    } as any,
  };
}

describe("Given: a subject reads the total of a single order", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: the owner reads their own order.
   *
   * Given: the subject owns the order.
   * When: the per-order total route executes.
   * Then: the response carries the order total grouped by currency and the unpriced lines beside it.
   */
  it("When: the owner requests the total Then: the order total and its unpriced lines are returned", async () => {
    const { service } = createService();
    const context = createContext();

    await new Handler(service).execute(context, jest.fn());

    expect(service.ecommerceModuleAssertSubjectOwnsOrder).toHaveBeenCalledWith({
      subjectId: SUBJECT_ID,
      ecommerceModuleOrderId: ORDER_ID,
    });
    expect(context.json).toHaveBeenCalledWith({
      data: [
        {
          billingModuleCurrency: { id: CURRENCY_ID },
          total: 200,
          orders: [
            expect.objectContaining({
              id: ORDER_ID,
              total: [
                {
                  total: 200,
                  billingModuleCurrency: { id: CURRENCY_ID },
                },
              ],
            }),
          ],
        },
      ],
      unpriced: [UNPRICED_LINE],
    });
  });

  /**
   * BDD Scenario: lines in two currencies.
   *
   * Given: the order holds lines priced in two currencies.
   * When: the per-order total route executes.
   * Then: one entry per currency is returned, each holding the order.
   */
  it("When: the order is priced in two currencies Then: one total per currency is returned", async () => {
    const { service } = createService({
      totals: [
        { total: 200, billingModuleCurrency: { id: CURRENCY_ID } },
        { total: 50, billingModuleCurrency: { id: "currency-2" } },
        { total: 25, billingModuleCurrency: { id: CURRENCY_ID } },
      ],
      unpriced: [],
    });
    const context = createContext();

    await new Handler(service).execute(context, jest.fn());

    const payload = context.json.mock.calls[0][0];

    expect(payload.data).toHaveLength(2);
    expect(payload.data[0]).toEqual(
      expect.objectContaining({
        billingModuleCurrency: { id: CURRENCY_ID },
        total: 225,
      }),
    );
    expect(payload.data[1]).toEqual(
      expect.objectContaining({
        billingModuleCurrency: { id: "currency-2" },
        total: 50,
      }),
    );
    expect(payload.unpriced).toEqual([]);
  });

  /**
   * BDD Scenario: another subject's order.
   *
   * Given: no relation links the subject to the order.
   * When: the per-order total route executes.
   * Then: the request is refused and no total is computed.
   */
  it("When: the order belongs to another subject Then: the request is refused before the total is computed", async () => {
    const { findByIdTotal, service } = createService({ ownsOrder: false });

    await expect(
      new Handler(service).execute(createContext(), jest.fn()),
    ).rejects.toThrow(NOT_OWNED_ERROR);

    expect(findByIdTotal).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: an order id that resolves to nothing.
   *
   * Given: the order id does not exist.
   * When: the per-order total route executes.
   * Then: the request fails as not found and no total is computed.
   */
  it("When: the order does not exist Then: the request fails as not found", async () => {
    const { findByIdTotal, service } = createService({ order: null });

    await expect(
      new Handler(service).execute(createContext(), jest.fn()),
    ).rejects.toThrow("Not Found error. No order found");

    expect(
      service.ecommerceModuleAssertSubjectOwnsOrder,
    ).not.toHaveBeenCalled();
    expect(findByIdTotal).not.toHaveBeenCalled();
  });
});
