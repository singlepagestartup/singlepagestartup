/**
 * BDD Suite: telegram checkout-free-subscription.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

const mockEcommerceModuleProductCheckout = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    ecommerceModuleProductCheckout: (...args: unknown[]) =>
      mockEcommerceModuleProductCheckout(...args),
  },
}));

import { Service } from "./checkout-free-subscription";

function createFreeSubscriptionContext(props?: {
  subjectToOrders?: {
    id: string;
    subjectId: string;
    ecommerceModuleOrderId: string;
  }[];
  orderFindById?: jest.Mock;
  orderFindByIdCheckoutAttributes?: jest.Mock;
}) {
  const subjectToOrders = props?.subjectToOrders ?? [];
  const subjectsToEcommerceModuleOrders = {
    find: jest.fn().mockImplementation(async () => [...subjectToOrders]),
  } as any;

  const ecommerceModule = {
    order: {
      findById: props?.orderFindById ?? jest.fn(),
      findByIdCheckoutAttributes:
        props?.orderFindByIdCheckoutAttributes ?? jest.fn(),
    },
    product: {
      find: jest.fn().mockResolvedValue([
        {
          id: "product-paid",
          type: "subscription",
        },
        {
          id: "product-free",
          type: "subscription",
        },
      ]),
    },
    attributeKey: {
      find: jest.fn().mockResolvedValue([
        {
          id: "attribute-key-price",
          type: "price",
        },
      ]),
    },
    attributeKeysToAttributes: {
      find: jest.fn().mockResolvedValue([
        {
          id: "aka-1",
          attributeKeyId: "attribute-key-price",
          attributeId: "attr-free-price",
        },
        {
          id: "aka-2",
          attributeKeyId: "attribute-key-price",
          attributeId: "attr-paid-price",
        },
      ]),
    },
    productsToAttributes: {
      find: jest.fn().mockResolvedValue([
        {
          id: "pta-1",
          productId: "product-free",
          attributeId: "attr-free-price",
        },
        {
          id: "pta-2",
          productId: "product-paid",
          attributeId: "attr-paid-price",
        },
      ]),
    },
    ordersToProducts: {
      find: jest.fn().mockResolvedValue([]),
    },
    attribute: {
      find: jest.fn().mockResolvedValue([
        {
          id: "attr-free-price",
          number: "0",
        },
        {
          id: "attr-paid-price",
          number: "199",
        },
      ]),
    },
    attributesToBillingModuleCurrencies: {
      find: jest.fn().mockResolvedValue([
        {
          id: "atbc-1",
          attributeId: "attr-free-price",
          billingModuleCurrencyId: "cur-telegram-star",
        },
      ]),
    },
  } as any;

  const billingModule = {
    currency: {
      findById: jest.fn().mockResolvedValue({
        id: "cur-telegram-star",
        slug: "telegram-star",
      }),
    },
  } as any;

  const service = new Service({
    subjectsToEcommerceModuleOrders,
    ecommerceModule,
    billingModule,
  });

  return {
    billingModule,
    ecommerceModule,
    service,
    subjectToOrders,
    subjectsToEcommerceModuleOrders,
  };
}

describe("Given: telegram user with attached subject triggers the bot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When: subject has an active subscription order", () => {
    /**
     * BDD Scenario: active subscription blocks automatic free checkout.
     *
     * Given: the subject already has an active subscription order.
     * When: telegram free subscription checkout is requested.
     * Then: product discovery and checkout are skipped.
     */
    it("Then: free subscription checkout is skipped", async () => {
      const { ecommerceModule, service } = createFreeSubscriptionContext({
        subjectToOrders: [
          {
            id: "stemo-1",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-active-subscription",
          },
        ],
        orderFindById: jest.fn().mockResolvedValue({
          id: "order-active-subscription",
          status: "paying",
        }),
        orderFindByIdCheckoutAttributes: jest.fn().mockResolvedValue({
          type: "subscription",
        }),
      });

      const result = await service.execute({
        id: "subject-1",
        chatId: "telegram-chat-1",
      });

      expect(result).toBeNull();
      expect(ecommerceModule.product.find).not.toHaveBeenCalled();
      expect(mockEcommerceModuleProductCheckout).not.toHaveBeenCalled();
    });
  });

  describe("When: subject has no orders and free subscription product exists", () => {
    /**
     * BDD Scenario: free checkout starts for a subject without orders.
     *
     * Given: the subject has no ecommerce orders and a zero-price subscription product exists.
     * When: telegram free subscription checkout is requested.
     * Then: checkout starts with telegram-star provider and privileged headers.
     */
    it("Then: free subscription checkout starts with telegram-star provider", async () => {
      const checkoutResult = {
        billingModule: {
          invoices: [],
        },
      };
      mockEcommerceModuleProductCheckout.mockResolvedValueOnce(checkoutResult);

      const { service } = createFreeSubscriptionContext();

      const result = await service.execute({
        id: "subject-1",
        chatId: "telegram-chat-1",
      });

      expect(result).toEqual(checkoutResult);
      expect(mockEcommerceModuleProductCheckout).toHaveBeenCalledTimes(1);
      expect(mockEcommerceModuleProductCheckout).toHaveBeenCalledWith({
        id: "subject-1",
        productId: "product-free",
        data: {
          provider: "telegram-star",
          billingModule: {
            currency: {
              id: "cur-telegram-star",
              slug: "telegram-star",
            },
          },
          account: "telegram-chat-1",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
            "Cache-Control": "no-store",
          },
        },
      });
    });
  });

  describe("When: two free-subscription requests race for one subject", () => {
    /**
     * BDD Scenario: independent requests are not serialized.
     *
     * Given: both requests initially target one eligible subject.
     * When: both requests reach checkout concurrently.
     * Then: both requests are allowed to checkout independently.
     */
    it("Then: performs two independent checkouts", async () => {
      const context = createFreeSubscriptionContext();
      const checkoutResult = {
        billingModule: {
          invoices: [],
        },
      };

      mockEcommerceModuleProductCheckout.mockResolvedValue(checkoutResult);

      const results = await Promise.all([
        context.service.execute({
          id: "subject-1",
          chatId: "telegram-chat-1",
        }),
        context.service.execute({
          id: "subject-1",
          chatId: "telegram-chat-1",
        }),
      ]);

      expect(results).toEqual([checkoutResult, checkoutResult]);
      expect(mockEcommerceModuleProductCheckout).toHaveBeenCalledTimes(2);
      expect(
        context.subjectsToEcommerceModuleOrders.find,
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe("When: subject has a completed free subscription order", () => {
    /**
     * BDD Scenario: message bootstrap does not recreate an expired free subscription.
     *
     * Given: the subject has a completed order for the free subscription product.
     * When: telegram free subscription checkout is requested.
     * Then: checkout is skipped because lifecycle renewal owns the next interval.
     */
    it("Then: free subscription checkout is not started by the message", async () => {
      const { ecommerceModule, service } = createFreeSubscriptionContext({
        subjectToOrders: [
          {
            id: "stemo-1",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-completed-subscription",
          },
        ],
        orderFindById: jest.fn().mockResolvedValue({
          id: "order-completed-subscription",
          status: "completed",
        }),
      });
      ecommerceModule.ordersToProducts.find.mockResolvedValueOnce([
        {
          id: "otp-1",
          orderId: "order-completed-subscription",
          productId: "product-free",
        },
      ]);

      const result = await service.execute({
        id: "subject-1",
        chatId: "telegram-chat-1",
      });

      expect(result).toBeNull();
      expect(ecommerceModule.ordersToProducts.find).toHaveBeenCalledWith({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "inArray",
                value: ["order-completed-subscription"],
              },
              {
                column: "productId",
                method: "eq",
                value: "product-free",
              },
            ],
          },
        },
      });
      expect(mockEcommerceModuleProductCheckout).not.toHaveBeenCalled();
    });
  });
});
