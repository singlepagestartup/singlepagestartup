/**
 * BDD Suite: per-order cart quantity controller behavior.
 *
 * Given: a subject asks for the quantity of one order by id.
 * When: the per-order quantity route executes.
 * Then: the owner receives the order quantity, and a caller who does not own the order is refused before the order is read, whether or not it exists.
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

import { Handler } from "./quantity";

const SUBJECT_ID = "subject-1";
const ORDER_ID = "order-1";
const NOT_OWNED_ERROR = "Permission error. Only order owner can read order";

const ORDER = {
  id: ORDER_ID,
  type: "cart",
  status: "new",
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
  quantity?: number;
}) {
  const order = props?.order === undefined ? ORDER : props.order;
  const ownsOrder = props?.ownsOrder ?? true;
  const quantity = props?.quantity ?? 3;

  const findByIdQuantity = jest.fn().mockResolvedValue(quantity);

  return {
    findByIdQuantity,
    service: {
      ecommerceModuleAssertSubjectOwnsOrder: jest.fn(async () => {
        if (!ownsOrder) {
          throw new Error(NOT_OWNED_ERROR);
        }
      }),
      ecommerceModule: {
        order: {
          findById: jest.fn().mockResolvedValue(order),
          findByIdQuantity,
        },
      },
    } as any,
  };
}

describe("Given: a subject reads the quantity of a single order", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: the owner reads their own order.
   *
   * Given: the subject owns the order.
   * When: the per-order quantity route executes.
   * Then: the response carries the quantity of that order.
   */
  it("When: the owner requests the quantity Then: the order quantity is returned", async () => {
    const { findByIdQuantity, service } = createService();
    const context = createContext();

    await new Handler(service).execute(context, jest.fn());

    expect(service.ecommerceModuleAssertSubjectOwnsOrder).toHaveBeenCalledWith({
      subjectId: SUBJECT_ID,
      ecommerceModuleOrderId: ORDER_ID,
    });
    expect(findByIdQuantity).toHaveBeenCalledWith({ id: ORDER_ID });
    expect(context.json).toHaveBeenCalledWith({ data: 3 });
  });

  /**
   * BDD Scenario: another subject's order.
   *
   * Given: no relation links the subject to the order.
   * When: the per-order quantity route executes.
   * Then: the request is refused and no quantity is computed.
   */
  it("When: the order belongs to another subject Then: the request is refused before the quantity is computed", async () => {
    const { findByIdQuantity, service } = createService({ ownsOrder: false });

    await expect(
      new Handler(service).execute(createContext(), jest.fn()),
    ).rejects.toThrow(NOT_OWNED_ERROR);

    expect(service.ecommerceModule.order.findById).not.toHaveBeenCalled();
    expect(findByIdQuantity).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: an order id that resolves to nothing.
   *
   * Given: the order id does not exist, so no relation links the subject to it.
   * When: the per-order quantity route executes.
   * Then: the request is refused exactly as for another subject's order, before
   *       the order is read, so the answer does not reveal which ids exist.
   */
  it("When: the order does not exist Then: the request is refused as for another subject's order", async () => {
    const { findByIdQuantity, service } = createService({
      order: null,
      ownsOrder: false,
    });

    await expect(
      new Handler(service).execute(createContext(), jest.fn()),
    ).rejects.toThrow(NOT_OWNED_ERROR);

    expect(service.ecommerceModule.order.findById).not.toHaveBeenCalled();
    expect(findByIdQuantity).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the owner's order is gone.
   *
   * Given: a relation still links the subject to an order that was deleted.
   * When: the per-order quantity route executes.
   * Then: the request fails as not found and no quantity is computed.
   */
  it("When: the subject owns an order that no longer exists Then: the request fails as not found", async () => {
    const { findByIdQuantity, service } = createService({ order: null });

    await expect(
      new Handler(service).execute(createContext(), jest.fn()),
    ).rejects.toThrow("Not Found error. No order found");

    expect(findByIdQuantity).not.toHaveBeenCalled();
  });
});
