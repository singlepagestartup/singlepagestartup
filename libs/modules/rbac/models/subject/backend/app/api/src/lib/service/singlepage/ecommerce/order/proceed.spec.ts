/**
 * BDD Suite: RBAC ecommerce order proceed bounded query contract.
 *
 * Given: the RBAC ecommerce order proceed service has mocked module services.
 * When: scoped and unscoped proceed checks are executed.
 * Then: candidate order and relation queries stay bounded and preserve subject scope.
 */

const mockSubjectsToRolesCreate = jest.fn();
const mockSubjectsToRolesDelete = jest.fn();
const mockSubjectsToBillingModuleCurrenciesCreate = jest.fn();
const mockSubjectsToBillingModuleCurrenciesUpdate = jest.fn();
const mockEcommerceOrderUpdate = jest.fn();
const mockSubjectProductCheckout = jest.fn();
const mockSubjectNotify = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-roles/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectsToRolesCreate(...args),
    delete: (...args: unknown[]) => mockSubjectsToRolesDelete(...args),
  },
}));

jest.mock(
  "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) =>
        mockSubjectsToBillingModuleCurrenciesCreate(...args),
      update: (...args: unknown[]) =>
        mockSubjectsToBillingModuleCurrenciesUpdate(...args),
    },
  }),
);

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    update: (...args: unknown[]) => mockEcommerceOrderUpdate(...args),
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    ecommerceModuleProductCheckout: (...args: unknown[]) =>
      mockSubjectProductCheckout(...args),
    notify: (...args: unknown[]) => mockSubjectNotify(...args),
  },
}));

import {
  ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT,
  ECOMMERCE_ORDER_PROCEED_STATUSES,
  Service,
} from "./proceed";

function createService(props?: {
  candidateOrders?: any[];
  relationFindResults?: any[][];
}) {
  const ecommerceModuleOrderFind = jest
    .fn()
    .mockResolvedValue(props?.candidateOrders ?? []);
  const subjectsToEcommerceModuleOrdersFind = jest.fn();

  for (const result of props?.relationFindResults ?? [[]]) {
    subjectsToEcommerceModuleOrdersFind.mockResolvedValueOnce(result);
  }

  subjectsToEcommerceModuleOrdersFind.mockResolvedValue([]);

  const service = new Service(
    {} as any,
    {
      attribute: { find: jest.fn().mockResolvedValue([]) },
      chat: { find: jest.fn().mockResolvedValue([]) },
      profilesToChats: { find: jest.fn().mockResolvedValue([]) },
    } as any,
    {
      order: {
        find: ecommerceModuleOrderFind,
        findByIdExtended: jest.fn(),
      },
    } as any,
    {
      template: { find: jest.fn().mockResolvedValue([]) },
    } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: subjectsToEcommerceModuleOrdersFind } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
  );

  return {
    ecommerceModuleOrderFind,
    service,
    subjectsToEcommerceModuleOrdersFind,
  };
}

describe("Given: unscoped RBAC ecommerce order proceed execution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: unscoped candidate orders are selected before relations.
   *
   * Given: the unscoped candidate order query returns no orders.
   * When: ecommerce order proceed runs without a subject id.
   * Then: the first query uses actionable statuses, batch limit, and updatedAt ordering.
   */
  it("Then: selects actionable orders with a fixed deterministic batch", async () => {
    const {
      ecommerceModuleOrderFind,
      service,
      subjectsToEcommerceModuleOrdersFind,
    } = createService();

    await service.execute({});

    expect(ecommerceModuleOrderFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "status",
              method: "inArray",
              value: ECOMMERCE_ORDER_PROCEED_STATUSES,
            },
          ],
        },
        limit: ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT,
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
    expect(subjectsToEcommerceModuleOrdersFind).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: unscoped relation lookup is bounded by selected order ids.
   *
   * Given: candidate order selection returns two actionable orders.
   * When: ecommerce order proceed runs without a subject id.
   * Then: relation lookup runs after order selection and receives only those order ids.
   */
  it("Then: fetches relations after candidate orders by selected order ids", async () => {
    const {
      ecommerceModuleOrderFind,
      service,
      subjectsToEcommerceModuleOrdersFind,
    } = createService({
      candidateOrders: [
        { id: "order-1", status: "paid" },
        { id: "order-2", status: "delivering" },
      ],
      relationFindResults: [[]],
    });

    await service.execute({});

    expect(subjectsToEcommerceModuleOrdersFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "ecommerceModuleOrderId",
              method: "inArray",
              value: ["order-1", "order-2"],
            },
          ],
        },
      },
    });
    expect(ecommerceModuleOrderFind.mock.invocationCallOrder[0]).toBeLessThan(
      subjectsToEcommerceModuleOrdersFind.mock.invocationCallOrder[0],
    );
    expect(subjectsToEcommerceModuleOrdersFind).not.toHaveBeenCalledWith({});
  });

  /**
   * BDD Scenario: duplicate and excessive candidate orders are normalized.
   *
   * Given: candidate order selection returns duplicates and more rows than the batch limit.
   * When: ecommerce order proceed prepares the relation handoff.
   * Then: relation ids are deduped and capped at the configured batch size.
   */
  it("Then: dedupes selected order ids and caps relation inArray size", async () => {
    const candidateOrders = [
      { id: "order-1", status: "paid" },
      { id: "order-1", status: "paid" },
      ...Array.from(
        { length: ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT + 5 },
        (_, index) => ({
          id: `order-${index + 2}`,
          status: "paid",
        }),
      ),
    ];

    const { service, subjectsToEcommerceModuleOrdersFind } = createService({
      candidateOrders,
      relationFindResults: [[]],
    });

    await service.execute({});

    const selectedOrderIds =
      subjectsToEcommerceModuleOrdersFind.mock.calls[0][0].params.filters.and[0]
        .value;

    expect(selectedOrderIds).toHaveLength(ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT);
    expect(new Set(selectedOrderIds).size).toBe(selectedOrderIds.length);
    expect(selectedOrderIds).not.toContain(
      `order-${ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT + 2}`,
    );
  });
});

describe("Given: scoped RBAC ecommerce order proceed execution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: scoped relation lookup remains subject constrained.
   *
   * Given: a subject id is provided to ecommerce order proceed.
   * When: the subject has no order relations.
   * Then: the relation lookup filters by subject id and no unscoped order batch runs.
   */
  it("Then: filters the initial relation lookup by subject id", async () => {
    const {
      ecommerceModuleOrderFind,
      service,
      subjectsToEcommerceModuleOrdersFind,
    } = createService({
      relationFindResults: [[]],
    });

    await service.execute({ subjectId: "subject-1" });

    expect(subjectsToEcommerceModuleOrdersFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: "subject-1",
            },
          ],
        },
      },
    });
    expect(ecommerceModuleOrderFind).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: scoped relation handoff includes subject and selected orders.
   *
   * Given: a subject has duplicate order relations and one selected candidate order.
   * When: ecommerce order proceed resolves relations for processing.
   * Then: the bounded relation lookup includes subject id and selected order id filters.
   */
  it("Then: keeps subject id on the bounded relation lookup", async () => {
    const { service, subjectsToEcommerceModuleOrdersFind } = createService({
      candidateOrders: [{ id: "order-1", status: "paid" }],
      relationFindResults: [
        [
          {
            id: "relation-1",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-1",
          },
          {
            id: "relation-2",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-1",
          },
        ],
        [],
      ],
    });

    await service.execute({ subjectId: "subject-1" });

    expect(subjectsToEcommerceModuleOrdersFind.mock.calls[1][0]).toEqual({
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
              value: ["order-1"],
            },
          ],
        },
      },
    });
  });
});

describe("Given: delivered subscription order without invoice context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: delivered subscription orders can lack reusable invoice context.
   *
   * Given: a delivered subscription order has one-off payment intent data but no invoices.
   * When: delivered order processing completes the order.
   * Then: the order is completed without indexing missing invoice data or creating renewal checkout.
   */
  it("Then: completes the order without creating a follow-up subscription checkout", async () => {
    const { service } = createService();

    await expect(
      service.delivered({
        order: {
          id: "order-1",
          status: "delivered",
        } as any,
        extendedOrder: {
          id: "order-1",
          status: "delivered",
          checkoutAttributesByCurrency: {
            type: "subscription",
          },
          ordersToBillingModulePaymentIntents: [
            {
              billingModulePaymentIntent: {
                type: "one_off",
                paymentIntentsToCurrencies: [
                  {
                    currency: {
                      id: "currency-1",
                    },
                  },
                ],
                paymentIntentsToInvoices: [],
              },
            },
          ],
          ordersToProducts: [
            {
              productId: "product-1",
            },
          ],
          ordersToFileStorageModuleFiles: [],
        } as any,
        subjectToEcommerceModuleOrder: {
          subjectId: "subject-1",
          ecommerceModuleOrderId: "order-1",
        },
        existingRolesIds: [],
        productsRolesIds: [],
        subjectsToRoles: [],
      }),
    ).resolves.toBeUndefined();

    expect(mockEcommerceOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "completed",
        }),
        id: "order-1",
      }),
    );
    expect(mockSubjectProductCheckout).not.toHaveBeenCalled();
  });
});
