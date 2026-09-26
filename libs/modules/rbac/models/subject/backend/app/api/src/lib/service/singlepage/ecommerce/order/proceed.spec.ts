/**
 * BDD Suite: RBAC ecommerce order proceed bounded query contract and fulfilment.
 *
 * Given: the RBAC ecommerce order proceed service has mocked module services.
 * When: scoped and unscoped proceed checks are executed and orders reach fulfilment.
 * Then: candidate order and relation queries stay bounded and preserve subject scope,
 * and products are granted only for orders whose payment is confirmed.
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
  socialModuleChats?: any[];
  socialModuleProfilesToChats?: any[];
  subjectsToSocialModuleProfiles?: any[];
  extendedOrder?: any;
  productRoleIds?: string[];
}) {
  const ecommerceModuleOrderFind = jest
    .fn()
    .mockResolvedValue(props?.candidateOrders ?? []);
  const subjectsToEcommerceModuleOrdersFind = jest.fn();
  const subjectsToSocialModuleProfilesFind = jest
    .fn()
    .mockResolvedValue(props?.subjectsToSocialModuleProfiles ?? []);

  for (const result of props?.relationFindResults ?? [[]]) {
    subjectsToEcommerceModuleOrdersFind.mockResolvedValueOnce(result);
  }

  subjectsToEcommerceModuleOrdersFind.mockResolvedValue([]);

  const service = new Service(
    {} as any,
    {
      attribute: { find: jest.fn().mockResolvedValue([]) },
      chat: {
        find: jest.fn().mockResolvedValue(props?.socialModuleChats ?? []),
      },
      profilesToChats: {
        find: jest
          .fn()
          .mockResolvedValue(props?.socialModuleProfilesToChats ?? []),
      },
    } as any,
    {
      order: {
        find: ecommerceModuleOrderFind,
        findByIdExtended: jest.fn().mockResolvedValue(props?.extendedOrder),
      },
    } as any,
    {
      template: { find: jest.fn().mockResolvedValue([]) },
    } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    {
      find: jest
        .fn()
        .mockResolvedValue(
          (props?.productRoleIds ?? []).map((roleId) => ({ roleId })),
        ),
    } as any,
    { find: subjectsToEcommerceModuleOrdersFind } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: subjectsToSocialModuleProfilesFind } as any,
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

  /**
   * BDD Scenario: concurrent lifecycle execution skips an order already in progress.
   *
   * Given: another request is already processing the selected order in the singleton service.
   * When: ecommerce order proceed selects the same order again.
   * Then: no order relations or lifecycle side effects are executed by the second request.
   */
  it("Then: skips an order whose lifecycle processing is already in progress", async () => {
    const { service, subjectsToEcommerceModuleOrdersFind } = createService({
      candidateOrders: [{ id: "order-1", status: "delivered" }],
      relationFindResults: [
        [
          {
            id: "relation-1",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-1",
          },
        ],
      ],
    });

    (service as any).processingOrderIds.add("order-1");

    await service.execute({});

    expect(subjectsToEcommerceModuleOrdersFind).toHaveBeenCalledTimes(1);
    expect(mockEcommerceOrderUpdate).not.toHaveBeenCalled();
    expect(mockSubjectProductCheckout).not.toHaveBeenCalled();
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

describe("Given: an expired Telegram Stars subscription order", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: a completed one-off Telegram Stars payment is renewed.
   *
   * Given: an expired subscription order has one product, one currency, one Telegram Stars invoice, and one Telegram chat.
   * When: delivered order processing completes the expired order.
   * Then: it creates a new checkout for the same product and Telegram account so the billing provider can send a new invoice.
   */
  it("Then: creates a new Telegram Stars checkout for the same subscription", async () => {
    const { service } = createService({
      subjectsToSocialModuleProfiles: [
        {
          socialModuleProfileId: "profile-1",
          subjectId: "subject-1",
        },
      ],
      socialModuleProfilesToChats: [
        {
          profileId: "profile-1",
          chatId: "chat-1",
        },
      ],
      socialModuleChats: [
        {
          id: "chat-1",
          sourceSystemId: "telegram-account-1",
          variant: "telegram",
        },
      ],
    });

    await service.delivered({
      order: {
        id: "order-1",
        status: "delivered",
      } as any,
      extendedOrder: {
        id: "order-1",
        status: "delivered",
        checkoutAttributesByCurrency: {
          type: "subscription",
          interval: "hour",
        },
        ordersToBillingModulePaymentIntents: [
          {
            billingModulePaymentIntent: {
              type: "one_off",
              paymentIntentsToCurrencies: [
                {
                  currency: {
                    id: "currency-telegram-star",
                    slug: "telegram-star",
                  },
                },
              ],
              paymentIntentsToInvoices: [
                {
                  invoice: {
                    id: "invoice-1",
                    provider: "telegram-star",
                  },
                },
              ],
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
    });

    expect(mockEcommerceOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "completed",
        }),
        id: "order-1",
      }),
    );
    expect(mockSubjectProductCheckout).toHaveBeenCalledWith({
      id: "subject-1",
      productId: "product-1",
      data: {
        provider: "telegram-star",
        billingModule: {
          currency: {
            id: "currency-telegram-star",
            slug: "telegram-star",
          },
        },
        account: "telegram-account-1",
      },
    });
  });
});

function createPaymentIntent(props: {
  status: string;
  invoiceStatuses: string[];
  amount?: number;
  provider?: string;
}) {
  return {
    billingModulePaymentIntent: {
      id: `intent-${props.status}-${props.invoiceStatuses.join("-")}`,
      status: props.status,
      amount: props.amount ?? 1000,
      type: "one_off",
      paymentIntentsToCurrencies: [],
      paymentIntentsToInvoices: props.invoiceStatuses.map((status, index) => {
        return {
          invoice: {
            id: `invoice-${index}`,
            status,
            amount: props.amount ?? 1000,
            provider: props.provider ?? "stripe",
          },
        };
      }),
    },
  };
}

function createExtendedOrder(props: {
  id: string;
  status: string;
  ordersToBillingModulePaymentIntents: any[];
}) {
  return {
    id: props.id,
    status: props.status,
    checkoutAttributesByCurrency: {
      type: "subscription",
      interval: "month",
    },
    ordersToProducts: [
      {
        productId: "product-pro",
        product: {
          id: "product-pro",
          productsToAttributes: [
            {
              attribute: {
                number: "300",
                attributeKeysToAttribute: [
                  {
                    attributeKey: {
                      type: "topup",
                    },
                  },
                ],
                attributesToBillingModuleCurrencies: [
                  {
                    billingModuleCurrencyId: "currency-token",
                    billingModuleCurrency: {
                      id: "currency-token",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
    ordersToBillingModulePaymentIntents:
      props.ordersToBillingModulePaymentIntents,
  };
}

function createPaidOrderProps(ordersToBillingModulePaymentIntents: any[]) {
  return {
    order: {
      id: "order-paid",
      status: "paid",
    } as any,
    extendedOrder: createExtendedOrder({
      id: "order-paid",
      status: "paid",
      ordersToBillingModulePaymentIntents,
    }) as any,
    subjectToEcommerceModuleOrder: {
      subjectId: "subject-1",
      ecommerceModuleOrderId: "order-paid",
    },
    existingRolesIds: [],
    productsRolesIds: ["role-pro"],
  };
}

function expectNothingGranted() {
  expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
  expect(mockSubjectsToBillingModuleCurrenciesCreate).not.toHaveBeenCalled();
  expect(mockSubjectsToBillingModuleCurrenciesUpdate).not.toHaveBeenCalled();
  expect(mockEcommerceOrderUpdate).not.toHaveBeenCalled();
}

describe("Given: a paid order reaching fulfilment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: a paid order with both payment records is fulfilled.
   *
   * Given: the order has a succeeded payment intent carrying a paid invoice.
   * When: fulfilment processes the paid order.
   * Then: the product role is granted, the top-up is credited and the order moves on.
   */
  it("Then: grants the product role and top-up and advances the order", async () => {
    const { service } = createService();

    await service.fromPaidStatus(
      createPaidOrderProps([
        createPaymentIntent({ status: "succeeded", invoiceStatuses: ["paid"] }),
      ]),
    );

    expect(mockSubjectsToRolesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          subjectId: "subject-1",
          roleId: "role-pro",
        },
      }),
    );
    expect(mockSubjectsToBillingModuleCurrenciesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subjectId: "subject-1",
          billingModuleCurrencyId: "currency-token",
          amount: "300",
        }),
      }),
    );
    expect(mockEcommerceOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "order-paid",
        data: expect.objectContaining({
          status: "delivering",
        }),
      }),
    );
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a paid order without both payment records is not fulfilled.
   *
   * Given: the order lacks a succeeded payment intent carrying a paid invoice.
   * When: fulfilment processes the paid order.
   * Then: nothing is granted, the order keeps its status, and the order is reported.
   */
  it.each([
    [
      "a succeeded payment intent without a paid invoice",
      [createPaymentIntent({ status: "succeeded", invoiceStatuses: ["open"] })],
    ],
    [
      "a paid invoice on a payment intent that did not succeed",
      [
        createPaymentIntent({
          status: "requires_payment_method",
          invoiceStatuses: ["paid"],
        }),
      ],
    ],
    ["no payment intent", []],
  ])(
    "When: the order has %s Then: grants nothing and reports the order",
    async (_, ordersToBillingModulePaymentIntents) => {
      const { service } = createService();

      await service.fromPaidStatus(
        createPaidOrderProps(ordersToBillingModulePaymentIntents),
      );

      expectNothingGranted();
      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining("without a confirmed payment"),
        {
          orderId: "order-paid",
          orderStatus: "paid",
          subjectId: "subject-1",
        },
      );
    },
  );

  /**
   * BDD Scenario: an unconfirmed paid order is reported once.
   *
   * Given: a paid order without payment records.
   * When: fulfilment processes it on two consecutive runs.
   * Then: nothing is granted on either run and the order is reported once.
   */
  it("When: the recurring check meets the order again Then: reports it only once", async () => {
    const { service } = createService();

    await service.fromPaidStatus(createPaidOrderProps([]));
    await service.fromPaidStatus(createPaidOrderProps([]));

    expectNothingGranted();
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: every payment path leaves records fulfilment accepts.
   *
   * Given: the payment records a payment path leaves on the order.
   * When: fulfilment processes the paid order.
   * Then: the product role is granted.
   */
  it.each([
    [
      "a provider purchase",
      [createPaymentIntent({ status: "succeeded", invoiceStatuses: ["paid"] })],
    ],
    [
      "a Telegram Stars payment",
      [
        createPaymentIntent({
          status: "succeeded",
          invoiceStatuses: ["paid"],
          amount: 1,
          provider: "telegram-star",
        }),
      ],
    ],
    [
      "a dummy provider payment in development",
      [
        createPaymentIntent({
          status: "succeeded",
          invoiceStatuses: ["paid"],
          provider: "dummy",
        }),
      ],
    ],
    [
      "a zero-amount free subscription",
      [
        createPaymentIntent({
          status: "succeeded",
          invoiceStatuses: ["paid"],
          amount: 0,
          provider: "telegram-star",
        }),
      ],
    ],
    [
      "a subscription whose next invoice is still open",
      [
        createPaymentIntent({
          status: "succeeded",
          invoiceStatuses: ["paid", "open"],
        }),
      ],
    ],
    [
      "a failed attempt followed by a successful payment",
      [
        createPaymentIntent({ status: "failed", invoiceStatuses: ["void"] }),
        createPaymentIntent({ status: "succeeded", invoiceStatuses: ["paid"] }),
      ],
    ],
  ])(
    "When: the records come from %s Then: grants the product role",
    async (_, ordersToBillingModulePaymentIntents) => {
      const { service } = createService();

      await service.fromPaidStatus(
        createPaidOrderProps(ordersToBillingModulePaymentIntents),
      );

      expect(mockSubjectsToRolesCreate).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).not.toHaveBeenCalled();
    },
  );
});

describe("Given: a delivering order reaching fulfilment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createDeliveringService(ordersToBillingModulePaymentIntents: any[]) {
    const subjectToEcommerceModuleOrder = {
      subjectId: "subject-1",
      ecommerceModuleOrderId: "order-delivering",
    };

    return createService({
      candidateOrders: [
        {
          id: "order-delivering",
          status: "delivering",
        },
      ],
      relationFindResults: [
        [subjectToEcommerceModuleOrder],
        [subjectToEcommerceModuleOrder],
      ],
      extendedOrder: createExtendedOrder({
        id: "order-delivering",
        status: "delivering",
        ordersToBillingModulePaymentIntents,
      }),
      productRoleIds: ["role-pro"],
    });
  }

  /**
   * BDD Scenario: a delivering order with both payment records keeps its product role.
   *
   * Given: a delivering order with a succeeded payment intent carrying a paid invoice, and a subject without the product role.
   * When: the subject's orders are processed.
   * Then: the product role is granted.
   */
  it("When: the payment is confirmed Then: grants the missing product role", async () => {
    const { service } = createDeliveringService([
      createPaymentIntent({ status: "succeeded", invoiceStatuses: ["paid"] }),
    ]);

    await service.execute({ subjectId: "subject-1" });

    expect(mockSubjectsToRolesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          subjectId: "subject-1",
          roleId: "role-pro",
        },
      }),
    );
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a delivering order without payment records grants nothing.
   *
   * Given: a delivering order without payment records, and a subject without the product role.
   * When: the subject's orders are processed.
   * Then: no role is granted and the order is reported with its status.
   */
  it("When: the payment is not confirmed Then: grants nothing and reports the order", async () => {
    const { service } = createDeliveringService([]);

    await service.execute({ subjectId: "subject-1" });

    expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining("without a confirmed payment"),
      {
        orderId: "order-delivering",
        orderStatus: "delivering",
        subjectId: "subject-1",
      },
    );
  });
});
