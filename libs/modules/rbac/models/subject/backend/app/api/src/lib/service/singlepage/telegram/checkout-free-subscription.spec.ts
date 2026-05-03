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
  const subjectsToEcommerceModuleOrders = {
    find: jest.fn().mockResolvedValue(props?.subjectToOrders ?? []),
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

  describe("When: subject has only one-off and terminal orders", () => {
    /**
     * BDD Scenario: non-active subscription history does not block free checkout.
     *
     * Given: the subject has an active one-off order and a completed subscription order.
     * When: telegram free subscription checkout is requested.
     * Then: checkout still starts for the zero-price subscription product.
     */
    it("Then: free subscription checkout starts with telegram-star provider", async () => {
      const checkoutResult = {
        billingModule: {
          invoices: [],
        },
      };
      mockEcommerceModuleProductCheckout.mockResolvedValueOnce(checkoutResult);

      const orderFindById = jest.fn(async ({ id }) => {
        if (id === "order-one-off") {
          return {
            id: "order-one-off",
            status: "paying",
          };
        }

        if (id === "order-completed-subscription") {
          return {
            id: "order-completed-subscription",
            status: "completed",
          };
        }

        return null;
      });
      const orderFindByIdCheckoutAttributes = jest.fn().mockResolvedValue({
        type: "one-time",
      });

      const { service } = createFreeSubscriptionContext({
        subjectToOrders: [
          {
            id: "stemo-1",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-one-off",
          },
          {
            id: "stemo-2",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-completed-subscription",
          },
        ],
        orderFindById,
        orderFindByIdCheckoutAttributes,
      });

      const result = await service.execute({
        id: "subject-1",
        chatId: "telegram-chat-1",
      });

      expect(result).toEqual(checkoutResult);
      expect(orderFindByIdCheckoutAttributes).toHaveBeenCalledTimes(1);
      expect(orderFindByIdCheckoutAttributes).toHaveBeenCalledWith({
        id: "order-one-off",
      });
      expect(mockEcommerceModuleProductCheckout).toHaveBeenCalledTimes(1);
      expect(mockEcommerceModuleProductCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "subject-1",
          productId: "product-free",
          data: expect.objectContaining({
            provider: "telegram-star",
            account: "telegram-chat-1",
          }),
        }),
      );
    });
  });
});
