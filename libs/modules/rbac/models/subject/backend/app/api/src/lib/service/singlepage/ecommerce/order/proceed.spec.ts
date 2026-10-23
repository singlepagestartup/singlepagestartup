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
  ...jest.requireActual("@sps/shared-utils"),
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
    ecommerceModuleProductCheckout: () => {
      throw new Error("Unexpected Subject loopback HTTP");
    },
    notify: (...args: unknown[]) => mockSubjectNotify(...args),
  },
}));

import {
  ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT,
  ECOMMERCE_ORDER_PROCEED_STATUSES,
  Service,
} from "./proceed";
import { Service as PeriodService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/subscription-period";

describe("durable subscription grant revocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-23T10:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
    mockSubjectsToRolesCreate.mockReset();
    mockSubjectsToRolesDelete.mockReset();
    mockEcommerceOrderUpdate.mockReset();
  });

  function lifecycle(
    status: string,
    granted: boolean,
    activated = true,
    renewalStatus = "paid",
  ) {
    let grants: any[] = granted
      ? [{ id: "grant", roleId: "subscriber", subjectId: "subject" }]
      : [];
    let order: any = {
      id: "subscription",
      type: "history",
      status,
      updatedAt: new Date("2026-10-22T10:00:00Z"),
      subscriptionPeriodStartsAt: activated
        ? new Date("2026-10-22T10:00:00Z")
        : null,
      subscriptionPeriodEndsAt: activated
        ? new Date("2026-10-23T10:00:00Z")
        : null,
      subscriptionPeriodInvoiceId: activated ? "invoice-a" : null,
      checkoutAttributesByCurrency: {
        amount: 0,
        type: "subscription",
        interval: "day",
      },
      ordersToFileStorageModuleFiles: [],
      ordersToProducts: [
        {
          productId: "product",
          product: { id: "product", productsToAttributes: [] },
        },
      ],
      ordersToBillingModulePaymentIntents: [
        {
          billingModulePaymentIntent: {
            id: "payment",
            type: "one_off",
            paymentIntentsToCurrencies: [{ currency: { id: "currency" } }],
            paymentIntentsToInvoices: [
              {
                invoice: {
                  id: "invoice-a",
                  status: "paid",
                  provider: "dummy",
                  amount: 0,
                  createdAt: new Date("2026-10-21T00:00:00Z"),
                },
              },
              {
                invoice: {
                  id: "invoice-b",
                  status: renewalStatus,
                  provider: "dummy",
                  amount: 0,
                  createdAt: new Date("2026-10-23T00:00:00Z"),
                },
              },
            ],
          },
        },
      ],
    };
    const { service } = createService();
    service.subjectsToEcommerceModuleOrders.find = jest
      .fn()
      .mockResolvedValue([
        { subjectId: "subject", ecommerceModuleOrderId: "subscription" },
      ]);
    service.subjectsToRoles.find = jest.fn(async () => grants);
    service.rolesToEcommerceModuleProducts.find = jest
      .fn()
      .mockResolvedValue([
        { roleId: "subscriber", ecommerceModuleProductId: "product" },
      ]);
    service.ecommerceModule.order.find = jest.fn(async () => [order]);
    service.ecommerceModule.order.findByIdExtended = jest.fn(async () => order);
    const period = new PeriodService({
      findByIdExtended: async () => order,
      findById: async () => order,
      writeSubscriptionPeriod: async ({
        before,
        startsAt,
        endsAt,
        invoiceId,
        status,
      }) => {
        if (
          before.subscriptionPeriodInvoiceId !==
          order.subscriptionPeriodInvoiceId
        )
          return undefined;
        order = {
          ...order,
          subscriptionPeriodStartsAt: startsAt,
          subscriptionPeriodEndsAt: endsAt,
          subscriptionPeriodInvoiceId: invoiceId,
          status,
        };
        return order;
      },
    });
    const accept = jest.fn((props) => period.execute(props));
    service.ecommerceModule.order.acceptSubscriptionPeriod = accept;
    service.ecommerceModule.order.assertSubscriptionPayment = (props) =>
      period.assertPayment(props);
    mockSubjectsToRolesCreate.mockImplementation(async ({ data }) => {
      grants = [...grants, { id: "new-grant", ...data }];
    });
    mockSubjectsToRolesDelete.mockImplementation(async ({ id }) => {
      grants = grants.filter((grant) => grant.id !== id);
    });
    mockEcommerceOrderUpdate.mockImplementation(async ({ data }) => {
      order = { ...order, ...data };
      return order;
    });
    jest.spyOn(service, "collectTopupCurrencies").mockResolvedValue([]);
    jest.spyOn(service, "notifyAdmin").mockResolvedValue(undefined);
    jest.spyOn(service, "notifyOrderOwner").mockResolvedValue(undefined);
    return { service, accept, order: () => order, grants: () => grants };
  }

  it.each(["delivering", "requested_cancelation", "paid", "delivered"])(
    "does not regrant or reactivate revoked %s orders even with a new paid invoice",
    async (status) => {
      const { service, accept, order, grants } = lifecycle(status, false);
      await service.execute({ subjectId: "subject" });
      expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
      expect(mockSubjectProductCheckout).not.toHaveBeenCalled();
      expect(accept).not.toHaveBeenCalled();
      expect(grants()).toEqual([]);
      expect(order().subscriptionPeriodInvoiceId).toBe("invoice-a");
      expect(order().subscriptionPeriodEndsAt).toEqual(
        new Date("2026-10-23T10:00:00Z"),
      );
    },
  );

  it("does not repair legacy delivering rows without a role or accepted period", async () => {
    const { service, accept, order } = lifecycle("delivering", false, false);
    await service.execute({ subjectId: "subject" });
    expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
    expect(accept).not.toHaveBeenCalled();
    expect(order().subscriptionPeriodInvoiceId).toBeNull();
  });

  it("leaves OPEN renewal unchanged and accepts later confirmed payment with a complete interval", async () => {
    const open = lifecycle("delivering", true, true, "open");
    await open.service.execute({ subjectId: "subject" });
    expect(open.order().subscriptionPeriodInvoiceId).toBe("invoice-a");
    const paid = lifecycle("delivering", true);
    await paid.service.execute({ subjectId: "subject" });
    expect(paid.order().subscriptionPeriodInvoiceId).toBe("invoice-b");
    expect(paid.order().subscriptionPeriodEndsAt).toEqual(
      new Date("2026-10-24T10:00:00Z"),
    );
    expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
  });

  it("allows a new explicit purchase to issue its first role and activate its first period", async () => {
    const { service, order, grants } = lifecycle("paid", false, false);
    await service.execute({ subjectId: "subject" });
    expect(mockSubjectsToRolesCreate).toHaveBeenCalledTimes(1);
    expect(grants()).toHaveLength(1);
    expect(order().status).toBe("delivering");
    expect(order().subscriptionPeriodInvoiceId).toBe("invoice-b");
    expect(order().subscriptionPeriodEndsAt).toEqual(
      new Date("2026-10-24T10:00:00Z"),
    );
  });

  it("uses the real topup collector before activating this subscription", async () => {
    const { service, order } = lifecycle("paid", false, false);
    (service.collectTopupCurrencies as jest.Mock).mockRestore();
    order().ordersToProducts[0].product.productsToAttributes = [
      {
        attribute: {
          number: "7",
          attributeKeysToAttribute: [{ attributeKey: { type: "topup" } }],
          attributesToBillingModuleCurrencies: [
            {
              billingModuleCurrencyId: "credits",
              billingModuleCurrency: { id: "credits" },
            },
          ],
        },
      },
    ];
    service.ecommerceModule.order.find = jest.fn(async (props: any) => {
      const filters = props.params.filters.and;
      return filters.every(
        (filter: any) =>
          filter.column !== "status" ||
          (filter.method === "inArray"
            ? filter.value.includes(order().status)
            : filter.value === order().status),
      )
        ? [order()]
        : [];
    });
    await service.execute({ subjectId: "subject" });
    expect(mockSubjectsToBillingModuleCurrenciesCreate).toHaveBeenCalledWith({
      data: {
        subjectId: "subject",
        billingModuleCurrencyId: "credits",
        amount: "7",
      },
    });
    expect(order().status).toBe("delivering");
  });

  it("does not issue the initial Role before a paid invoice has been verified", async () => {
    const { service, order, grants } = lifecycle("paid", false, false);
    for (const link of order().ordersToBillingModulePaymentIntents)
      for (const relation of link.billingModulePaymentIntent
        .paymentIntentsToInvoices)
        relation.invoice.status = "open";
    await service.execute({ subjectId: "subject" });
    expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
    expect(grants()).toEqual([]);
    expect(order().subscriptionPeriodInvoiceId).toBeNull();
    expect(service.collectTopupCurrencies).not.toHaveBeenCalled();
  });

  it("uses the fresh Order instead of stale paid candidate data when a grant has been revoked", async () => {
    const { service, order } = lifecycle("delivering", false);
    (service.ecommerceModule.order.find as jest.Mock).mockResolvedValue([
      { ...order(), status: "paid", subscriptionPeriodInvoiceId: null },
    ]);
    await service.execute({ subjectId: "subject" });
    expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
    expect(order().subscriptionPeriodInvoiceId).toBe("invoice-a");
  });

  it("reactivates a naturally expired recurring Order after late confirmed renewal with a full interval", async () => {
    const { service, order, grants } = lifecycle(
      "delivered",
      true,
      true,
      "open",
    );
    order().ordersToBillingModulePaymentIntents[0].billingModulePaymentIntent.type =
      "subscription";
    await service.execute({ subjectId: "subject" });
    expect(order().status).toBe("expired");
    expect(grants()).toHaveLength(0);
    expect(order().subscriptionRevokedAt).toBeUndefined();
    jest.setSystemTime(new Date("2026-10-23T13:00:00Z"));
    order().ordersToBillingModulePaymentIntents[0].billingModulePaymentIntent.paymentIntentsToInvoices[1].invoice.status =
      "paid";
    await service.execute({ subjectId: "subject" });
    expect(order().status).toBe("delivering");
    expect(grants()).toHaveLength(1);
    expect(order().subscriptionPeriodStartsAt).toEqual(
      new Date("2026-10-23T13:00:00Z"),
    );
    expect(order().subscriptionPeriodEndsAt).toEqual(
      new Date("2026-10-24T13:00:00Z"),
    );
  });

  it("completes a non-subscription delivery through the trusted fulfillment grant removal", async () => {
    const { service, order } = lifecycle("delivered", true, true, "open");
    order().checkoutAttributesByCurrency.type = "one_off";
    order().subscriptionPeriodInvoiceId = null;
    order().subscriptionPeriodStartsAt = null;
    order().subscriptionPeriodEndsAt = null;
    await service.execute({ subjectId: "subject" });
    expect(mockSubjectsToRolesDelete).toHaveBeenCalledWith({
      id: "grant",
      subjectId: "subject",
      orderId: "subscription",
    });
    expect(order().status).toBe("completed");
    expect(mockSubjectProductCheckout).not.toHaveBeenCalled();
  });

  it.each(["expired", "paid", "delivering"])(
    "never revives explicitly revoked %s Orders even after a Role is recreated",
    async (status) => {
      const { service, order, accept } = lifecycle(status, true);
      order().subscriptionRevokedAt = new Date("2026-10-23T09:00:00Z");
      await service.execute({ subjectId: "subject" });
      expect(accept).not.toHaveBeenCalled();
      expect(order().subscriptionPeriodInvoiceId).toBe("invoice-a");
      expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
    },
  );

  it.each(["active", "expired", "unowned", "missing-role", "revoked"])(
    "preserves a shared grant only for another owned active valid subscription: %s",
    async (kind) => {
      const { service, order } = lifecycle("delivered", true, true, "open");
      const currentLink = {
        subjectId: "subject",
        ecommerceModuleOrderId: "subscription",
      };
      service.subjectsToEcommerceModuleOrders.find = jest
        .fn()
        .mockResolvedValue([
          currentLink,
          {
            subjectId: kind === "unowned" ? "other" : "subject",
            ecommerceModuleOrderId: "other-order",
          },
        ] as any);
      const other = {
        ...order(),
        id: "other-order",
        status: "delivering",
        subscriptionPeriodStartsAt: new Date("2026-10-23T00:00:00Z"),
        subscriptionPeriodEndsAt: new Date(
          kind === "expired" ? "2026-10-23T01:00:00Z" : "2026-10-24T00:00:00Z",
        ),
        subscriptionRevokedAt:
          kind === "revoked" ? new Date("2026-10-23T09:00:00Z") : null,
      };
      service.ecommerceModule.order.find = jest.fn(async (props: any) =>
        props.params.filters.and.some(
          (filter: any) =>
            filter.column === "status" && filter.value.length === 2,
        )
          ? [other]
          : [order()],
      );
      service.ecommerceModule.ordersToProducts = {
        find: jest
          .fn()
          .mockResolvedValue([
            { orderId: "other-order", productId: "other-product" },
          ]),
      } as any;
      service.rolesToEcommerceModuleProducts.find = jest.fn(
        async (props: any) =>
          props.params.filters.and[0].value.includes("other-product")
            ? [
                {
                  roleId: "subscriber",
                  ecommerceModuleProductId: "other-product",
                },
                ...(kind === "missing-role"
                  ? [
                      {
                        roleId: "revoked",
                        ecommerceModuleProductId: "other-product",
                      },
                    ]
                  : []),
              ]
            : [{ roleId: "subscriber", ecommerceModuleProductId: "product" }],
      ) as any;
      await service.execute({ subjectId: "subject" });
      if (kind === "active")
        expect(mockSubjectsToRolesDelete).not.toHaveBeenCalled();
      else
        expect(mockSubjectsToRolesDelete).toHaveBeenCalledWith(
          expect.objectContaining({ id: "grant" }),
        );
      expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
    },
  );

  it("cancels one exact Order without globally revoking an expired Order sharing its Role", async () => {
    const cancel = lifecycle("canceling", true);
    const revoke = jest.fn(async () => {
      cancel.order().subscriptionRevokedAt = new Date();
      return cancel.order();
    });
    cancel.service.ecommerceModule.order.revokeSubscription = revoke;
    const genericDelete = jest.spyOn(cancel.service.subjectsToRoles, "delete");
    await cancel.service.execute({ subjectId: "subject" });
    expect(revoke).toHaveBeenCalledWith({ id: "subscription" });
    expect(genericDelete).not.toHaveBeenCalled();
    expect(mockSubjectsToRolesDelete).toHaveBeenCalledWith({
      id: "grant",
      subjectId: "subject",
      orderId: "subscription",
    });
    expect(cancel.order().status).toBe("canceled");
    const previouslyExpired = lifecycle("expired", false);
    await previouslyExpired.service.execute({ subjectId: "subject" });
    expect(previouslyExpired.order().subscriptionRevokedAt).toBeUndefined();
    expect(previouslyExpired.order().status).toBe("delivering");
    expect(previouslyExpired.order().subscriptionPeriodInvoiceId).toBe(
      "invoice-b",
    );
  });
  it("credits a newly accepted paid Pro cycle once and retains existing purchased tokens", async () => {
    const { service, order } = lifecycle("delivering", true);
    (service.collectTopupCurrencies as jest.Mock).mockResolvedValue([
      {
        billingModuleCurrencyId: "tokens",
        billingModuleCurrency: { id: "tokens", slug: "token" },
        amount: "5000",
      },
    ]);
    let amount = "1200";
    service.subjectsToBillingModuleCurrencies.find = jest.fn(
      async () =>
        [{ id: "wallet", billingModuleCurrencyId: "tokens", amount }] as any,
    );
    const credit = jest.fn(async (props) => {
      expect(props.expectedAmount).toBe(amount);
      amount = props.amount;
      return { id: "wallet", amount };
    });
    service.subjectsToBillingModuleCurrencies.updateAmountIfUnchanged = credit;
    await service.execute({ subjectId: "subject" });
    expect(order().subscriptionPeriodInvoiceId).toBe("invoice-b");
    expect(amount).toBe("6200");
    await service.execute({ subjectId: "subject" });
    expect(amount).toBe("6200");
    expect(credit).toHaveBeenCalledTimes(1);
  });

  it("does not apply referral bonuses to the exact initial 3000 Free grant", async () => {
    const { service, order } = lifecycle("paid", false, false);
    order().ordersToProducts[0].product.slug = "free-subscription";
    service.subjectsToIdentities.find = jest.fn(
      async () => [{ subjectId: "subject" }] as any,
    );
    service.ecommerceModule.ordersToProducts = {
      find: jest.fn(async () => [
        { orderId: "subscription", productId: "product" },
      ]),
    } as any;
    (service.collectTopupCurrencies as jest.Mock).mockResolvedValue([
      {
        billingModuleCurrencyId: "tokens",
        billingModuleCurrency: { id: "tokens", slug: "token" },
        amount: "3000",
      },
    ]);
    service.subjectsToSocialModuleProfiles.find = jest.fn(
      async () => [{ socialModuleProfileId: "invited" }] as any,
    );
    await service.execute({ subjectId: "subject" });
    expect(service.socialModule.attribute.find).not.toHaveBeenCalled();
    expect(mockSubjectsToBillingModuleCurrenciesCreate).toHaveBeenCalledWith({
      data: {
        subjectId: "subject",
        billingModuleCurrencyId: "tokens",
        amount: "3000",
      },
    });
  });

  it("does not clear any Currency balance while canceling a Pro Order", async () => {
    const { service, order } = lifecycle("canceling", true);
    service.ecommerceModule.order.revokeSubscription = jest.fn(async () => {
      order().subscriptionRevokedAt = new Date();
      return order();
    });
    service.subjectsToBillingModuleCurrencies.find = jest.fn(
      async () =>
        [
          { id: "tokens", amount: "9000" },
          { id: "usd", amount: "25" },
        ] as any,
    );
    await service.execute({ subjectId: "subject" });
    expect(order().status).toBe("canceled");
    expect(
      service.subjectsToBillingModuleCurrencies.find,
    ).not.toHaveBeenCalled();
    expect(mockSubjectsToBillingModuleCurrenciesUpdate).not.toHaveBeenCalled();
  });
});

it("never renews internal Free and preserves all wallet balances on completion", async () => {
  jest.clearAllMocks();
  const { service } = createService();
  (
    service.subjectsToBillingModuleCurrencies.find as jest.Mock
  ).mockResolvedValue([
    { id: "token-balance", variant: "default", amount: "11" },
  ]);
  jest
    .spyOn(service as any, "freshLifecycleProps")
    .mockImplementation(async (props: any) => props);
  await service.delivered({
    order: { id: "free-order", status: "delivered" } as any,
    extendedOrder: {
      id: "free-order",
      checkoutAttributesByCurrency: {
        amount: 0,
        type: "subscription",
        interval: "day",
      },
      ordersToProducts: [
        { productId: "free-product", product: { slug: "free-subscription" } },
      ],
      ordersToBillingModulePaymentIntents: [
        {
          billingModulePaymentIntent: {
            type: "one_off",
            paymentIntentsToCurrencies: [{ currency: { id: "currency" } }],
            paymentIntentsToInvoices: [
              { invoice: { provider: "dummy", amount: 0 } },
            ],
          },
        },
      ],
    } as any,
    subjectToEcommerceModuleOrder: {
      subjectId: "user",
      ecommerceModuleOrderId: "free-order",
    },
    existingRolesIds: [],
    productsRolesIds: [],
    subjectsToRoles: [],
  });
  expect(mockSubjectProductCheckout).not.toHaveBeenCalled();
  expect(mockSubjectsToBillingModuleCurrenciesUpdate).not.toHaveBeenCalled();
  expect(service.subjectsToBillingModuleCurrencies.find).not.toHaveBeenCalled();
});

function createService(props?: {
  candidateOrders?: any[];
  relationFindResults?: any[][];
  socialModuleChats?: any[];
  socialModuleProfilesToChats?: any[];
  subjectsToSocialModuleProfiles?: any[];
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
    {
      lockOrderDelivery: async () => undefined,
      withOrderDelivery: async (
        _scope: unknown,
        operation: () => Promise<unknown>,
      ) => operation(),
    } as any,
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
        findByIdExtended: jest.fn(),
        lockForLifecycle: async () => undefined,
        update: (...args: unknown[]) => mockEcommerceOrderUpdate(...args),
      },
    } as any,
    {
      template: { find: jest.fn().mockResolvedValue([]) },
    } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    { find: subjectsToEcommerceModuleOrdersFind } as any,
    {
      find: jest.fn().mockResolvedValue([]),
      create: (...args: unknown[]) => mockSubjectsToRolesCreate(...args),
      delete: (...args: unknown[]) => mockSubjectsToRolesDelete(...args),
      deleteForOrderFulfillment: (...args: unknown[]) =>
        mockSubjectsToRolesDelete(...args),
    } as any,
    { find: subjectsToSocialModuleProfilesFind } as any,
    {
      find: jest.fn().mockResolvedValue([]),
      updateAmountIfUnchanged: jest.fn(async (props) => ({
        id: props.id,
        amount: props.amount,
      })),
      create: (...args: unknown[]) =>
        mockSubjectsToBillingModuleCurrenciesCreate(...args),
      update: (...args: unknown[]) =>
        mockSubjectsToBillingModuleCurrenciesUpdate(...args),
    } as any,
    { find: jest.fn().mockResolvedValue([]) } as any,
    mockSubjectProductCheckout,
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
              value: ["paid", "delivered", "canceling"],
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
        limit: ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT,
        offset: 0,
        orderBy: { and: [{ column: "id", method: "asc" }] },
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

describe("bounded fair order scheduling", () => {
  it.each([false, true])(
    "processes a fresh paid purchase behind more than 100 expired orders, scoped=%s",
    async (scoped) => {
      const dataset: any[] = Array.from({ length: 151 }, (_, index) => ({
        id: `order-${String(index).padStart(4, "0")}`,
        status: index === 150 ? "paid" : "expired",
        updatedAt: new Date(2026, 0, 1, 0, index),
        ordersToProducts: [],
      }));
      const links = dataset.map((order) => ({
        id: `link-${order.id}`,
        subjectId: "subject",
        ecommerceModuleOrderId: order.id,
      }));
      const { service } = createService();
      const find = jest.fn(async (props: any) => {
        const filters = props.params.filters.and;
        return dataset
          .filter((order) =>
            filters.every((filter: any) =>
              filter.column === "status"
                ? filter.value.includes(order.status)
                : filter.column === "id" && filter.method === "inArray"
                  ? filter.value.includes(order.id)
                  : filter.column === "id" && filter.method === "gt"
                    ? order.id > filter.value
                    : true,
            ),
          )
          .sort((a, b) => a.id.localeCompare(b.id))
          .slice(0, props.params.limit);
      });
      service.ecommerceModule.order.find = find;
      service.ecommerceModule.order.findByIdExtended = jest.fn(async ({ id }) =>
        dataset.find((order) => order.id === id),
      );
      service.subjectsToEcommerceModuleOrders.find = jest.fn(
        async (props: any) => {
          const selected = props.params.filters.and.find(
            (filter: any) => filter.column === "ecommerceModuleOrderId",
          );
          return selected
            ? links.filter((link) =>
                selected.value.includes(link.ecommerceModuleOrderId),
              )
            : links.slice(
                props.params.offset,
                props.params.offset + props.params.limit,
              );
        },
      ) as any;
      const paid = jest
        .spyOn(service, "fromPaidStatus")
        .mockResolvedValue(undefined);
      await service.execute(scoped ? { subjectId: "subject" } : {});
      expect(paid).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({ id: "order-0150", status: "paid" }),
        }),
      );
      expect(paid.mock.calls.length).toBe(ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT);
      paid.mockClear();
      await service.execute(scoped ? { subjectId: "subject" } : {});
      expect(
        paid.mock.calls.some(([props]) => props.order.id === "order-0149"),
      ).toBe(true);
      expect(paid.mock.calls.length).toBeLessThanOrEqual(
        ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT,
      );
      if (scoped)
        expect(find.mock.calls[0][0].params.filters.and[0].value).toHaveLength(
          151,
        );
    },
  );
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
    jest
      .spyOn(service as any, "freshLifecycleProps")
      .mockImplementation(async (props: any) => props);

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
              product: { id: "product-1", slug: "paid-subscription" },
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

    jest
      .spyOn(service as any, "freshLifecycleProps")
      .mockImplementation(async (props: any) => props);
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
            product: { id: "product-1", slug: "paid-subscription" },
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

describe("quantity-aware additive token collection", () => {
  const topup = (number: string, currencyId = "token") => ({
    attribute: {
      number,
      attributeKeysToAttribute: [{ attributeKey: { type: "topup" } }],
      attributesToBillingModuleCurrencies: [
        {
          billingModuleCurrencyId: currencyId,
          billingModuleCurrency: { id: currencyId, slug: currencyId },
        },
      ],
    },
  });
  it("multiplies each pack by its paid quantity and sums by Currency", async () => {
    const { service } = createService();
    const result = await service.collectTopupCurrencies({
      extendedOrder: {
        ordersToProducts: [
          { quantity: 2, product: { productsToAttributes: [topup("100")] } },
          { quantity: 3, product: { productsToAttributes: [topup("50")] } },
        ],
      } as any,
      subjectToEcommerceModuleOrder: { subjectId: "subject" } as any,
    });
    expect(result).toEqual([
      {
        billingModuleCurrencyId: "token",
        billingModuleCurrency: { id: "token", slug: "token" },
        amount: "350",
      },
    ]);
  });
  it("does not suppress a newly paid Pro Order because the same Product is already delivering", async () => {
    const { service, subjectsToEcommerceModuleOrdersFind } = createService();
    subjectsToEcommerceModuleOrdersFind.mockResolvedValue([
      { subjectId: "subject", ecommerceModuleOrderId: "old-delivering-pro" },
    ]);
    const result = await service.collectTopupCurrencies({
      extendedOrder: {
        ordersToProducts: [
          {
            productId: "pro",
            quantity: 1,
            product: { id: "pro", productsToAttributes: [topup("5000")] },
          },
        ],
      } as any,
      subjectToEcommerceModuleOrder: {
        subjectId: "subject",
        ecommerceModuleOrderId: "new-paid-pro",
      } as any,
    });
    expect(result[0].amount).toBe("5000");
    expect(subjectsToEcommerceModuleOrdersFind).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5, Infinity])(
    "rejects invalid paid quantity %s",
    async (quantity) => {
      const { service } = createService();
      await expect(
        service.collectTopupCurrencies({
          extendedOrder: {
            ordersToProducts: [
              { quantity, product: { productsToAttributes: [topup("100")] } },
            ],
          } as any,
          subjectToEcommerceModuleOrder: {} as any,
        }),
      ).rejects.toThrow("positive integer");
    },
  );
  it.each(["", "-1", "NaN", "Infinity"])(
    "rejects invalid credit amount %s",
    async (amount) => {
      const { service } = createService();
      await expect(
        service.collectTopupCurrencies({
          extendedOrder: {
            ordersToProducts: [
              {
                quantity: 1,
                product: { productsToAttributes: [topup(amount)] },
              },
            ],
          } as any,
          subjectToEcommerceModuleOrder: {} as any,
        }),
      ).rejects.toThrow("finite and positive");
    },
  );
});
