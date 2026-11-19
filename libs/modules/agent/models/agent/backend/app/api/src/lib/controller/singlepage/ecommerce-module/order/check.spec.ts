/**
 * BDD Suite: agent ecommerce order check bounded query contract.
 *
 * Given: the agent ecommerce order check handler has mocked services.
 * When: the scheduled check endpoint executes.
 * Then: it queries only current lifecycle statuses in a deterministic bounded batch.
 */

const mockEcommerceOrderCheck = jest.fn();
const mockLoggerInfo = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    details: error,
    message: error.message,
    status: 500,
  }),
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    check: (...args: unknown[]) => mockEcommerceOrderCheck(...args),
  },
}));

import {
  ECOMMERCE_ORDER_CHECK_BATCH_LIMIT,
  ECOMMERCE_ORDER_CHECK_STATUSES,
  Handler,
} from "./check";

function createContext() {
  return {
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

describe("Given: agent ecommerce order check execution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEcommerceOrderCheck.mockResolvedValue({ data: { ok: true } });
  });

  /**
   * BDD Scenario: current order checks use explicit lifecycle statuses.
   *
   * Given: the order service returns one current order.
   * When: the agent order-check handler executes.
   * Then: the find query is bounded and the order check SDK is called for that order.
   */
  it("Then: filters to current lifecycle statuses with limit and updatedAt ordering", async () => {
    const ecommerceModuleOrderFind = jest.fn().mockResolvedValue([
      {
        id: "order-1",
        status: "paying",
      },
    ]);
    const handler = new Handler({
      modules: {
        ecommerce: {
          order: {
            find: ecommerceModuleOrderFind,
          },
        },
      },
    } as any);

    await handler.execute(createContext(), jest.fn());

    expect(ecommerceModuleOrderFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "status",
              method: "inArray",
              value: ECOMMERCE_ORDER_CHECK_STATUSES,
            },
          ],
        },
        limit: ECOMMERCE_ORDER_CHECK_BATCH_LIMIT,
        orderBy: {
          and: [
            {
              column: "updatedAt",
              method: "asc",
            },
          ],
        },
      },
    });
    expect(mockEcommerceOrderCheck).toHaveBeenCalledWith({
      data: {},
      id: "order-1",
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
  });

  it("rotates automatic failure recovery independently of a full current-order batch", async () => {
    const failed = Array.from(
      { length: ECOMMERCE_ORDER_CHECK_BATCH_LIMIT + 1 },
      (_, index) => ({
        id: `failed-${String(index).padStart(3, "0")}`,
        status: "canceled",
        type: "history",
        paymentFailureCanceledAt: "2026-11-16T00:00:00Z",
      }),
    );
    const find = jest.fn().mockImplementation(async ({ params }) => {
      const recovery = params.filters.and.some(
        (filter: any) => filter.column === "paymentFailureCanceledAt",
      );
      if (!recovery) {
        return Array.from(
          { length: ECOMMERCE_ORDER_CHECK_BATCH_LIMIT },
          (_, index) => ({ id: `paying-${index}` }),
        );
      }
      const after = params.filters.and.find(
        (filter: any) => filter.column === "id",
      )?.value;
      return failed
        .filter((order) => !after || order.id > after)
        .slice(0, params.limit);
    });
    const service = { modules: { ecommerce: { order: { find } } } } as any;
    await new Handler(service).execute(createContext(), undefined);
    expect(mockEcommerceOrderCheck).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: failed.at(-1)!.id }),
    );
    mockEcommerceOrderCheck.mockClear();
    await new Handler(service).execute(createContext(), undefined);
    expect(mockEcommerceOrderCheck).toHaveBeenCalledWith(
      expect.objectContaining({ id: failed.at(-1)!.id }),
    );
    expect(find).toHaveBeenLastCalledWith({
      params: {
        filters: {
          and: [
            { column: "type", method: "eq", value: "history" },
            {
              column: "status",
              method: "inArray",
              value: ["canceling", "canceled"],
            },
            {
              column: "paymentFailureCanceledAt",
              method: "isNotNull",
              value: null,
            },
            { column: "id", method: "gt", value: failed[99].id },
          ],
        },
        limit: ECOMMERCE_ORDER_CHECK_BATCH_LIMIT,
        orderBy: { and: [{ column: "id", method: "asc" }] },
      },
    });
    mockEcommerceOrderCheck.mockClear();
    await new Handler(service).execute(createContext(), undefined);
    expect(mockEcommerceOrderCheck).toHaveBeenCalledWith(
      expect.objectContaining({ id: failed[0].id }),
    );
  });
});
