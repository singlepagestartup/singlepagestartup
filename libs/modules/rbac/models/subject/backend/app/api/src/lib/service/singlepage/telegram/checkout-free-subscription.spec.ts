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

describe("Given: telegram user with attached subject triggers the bot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When: subject already has at least one order", () => {
    it("Then: free subscription checkout is skipped", async () => {
      const subjectsToEcommerceModuleOrders = {
        find: jest.fn().mockResolvedValue([
          {
            id: "stemo-1",
            subjectId: "subject-1",
            ecommerceModuleOrderId: "order-1",
          },
        ]),
      } as any;

      const ecommerceModule = {
        product: {
          find: jest.fn(),
        },
      } as any;

      const billingModule = {
        currency: {
          findById: jest.fn(),
        },
      } as any;

      const service = new Service({
        subjectsToEcommerceModuleOrders,
        ecommerceModule,
        billingModule,
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
    it("Then: free subscription checkout starts with telegram-star provider", async () => {
      const checkoutResult = {
        billingModule: {
          invoices: [],
        },
      };
      mockEcommerceModuleProductCheckout.mockResolvedValueOnce(checkoutResult);

      const subjectsToEcommerceModuleOrders = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      const ecommerceModule = {
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
      });
    });
  });
});
