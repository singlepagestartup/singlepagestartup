/**
 * BDD Suite: rbac ecommerce product checkout controller behavior.
 *
 * Given: product checkout handler dependencies are mocked for deterministic order creation.
 * When: subject checks out directly from product page.
 * Then: handler creates order graph and delegates payment checkout with provider-specific deanonymization,
 * and refuses a quantity outside the order line bounds before anything is written.
 */

const orderCreateMock = jest.fn();
const subjectsToOrdersCreateMock = jest.fn();
const ordersToProductsCreateMock = jest.fn();
const storesToOrdersCreateMock = jest.fn();
const ordersToBillingCurrenciesCreateMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => orderCreateMock(...args),
  },
}));

jest.mock(
  "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) => subjectsToOrdersCreateMock(...args),
    },
  }),
);

jest.mock("@sps/ecommerce/relations/orders-to-products/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => ordersToProductsCreateMock(...args),
  },
}));

jest.mock("@sps/ecommerce/relations/stores-to-orders/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => storesToOrdersCreateMock(...args),
  },
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) =>
        ordersToBillingCurrenciesCreateMock(...args),
    },
  }),
);

import { quantityBounds } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { Handler } from "./checkout";

function createContext(
  params: Record<string, string | undefined>,
  body: Record<string, unknown>,
) {
  return {
    req: {
      param: (name: string) => params[name],
      parseBody: jest.fn().mockResolvedValue(body),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    findById: jest.fn().mockResolvedValue({ id: "subject-1" }),
    deanonymize: jest.fn().mockResolvedValue(undefined),
    ecommerceOrderCheckout: jest.fn().mockResolvedValue({
      provider: "stripe",
      checkoutUrl: "https://example.test/pay",
    }),
    ecommerceModule: {
      store: {
        find: jest.fn().mockResolvedValue([{ id: "store-1" }]),
      },
      productsToAttributes: {
        find: jest.fn().mockResolvedValue([]),
      },
      attributesToBillingModuleCurrencies: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
    billingModule: {
      currency: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
  } as any;
}

describe("Given: ecommerce product checkout handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    orderCreateMock.mockResolvedValue({ id: "order-1" });
    subjectsToOrdersCreateMock.mockResolvedValue({ id: "sto-1" });
    ordersToProductsCreateMock.mockResolvedValue({ id: "otp-1" });
    storesToOrdersCreateMock.mockResolvedValue({ id: "s2o-1" });
    ordersToBillingCurrenciesCreateMock.mockResolvedValue({ id: "otbc-1" });
  });

  it("When: provider is not telegram-star Then: subject is deanonymized and checkout is created", async () => {
    const service = createService();
    const handler = new Handler(service);

    const context = createContext(
      { id: "subject-1", productId: "product-1" },
      {
        data: JSON.stringify({
          provider: "stripe",
          email: "user@example.test",
          quantity: 2,
          storeId: "store-1",
          billingModule: { currency: { id: "currency-1" } },
        }),
      },
    );

    await handler.execute(context, jest.fn());

    expect(orderCreateMock).toHaveBeenCalledTimes(1);
    expect(subjectsToOrdersCreateMock).toHaveBeenCalledTimes(1);
    expect(ordersToProductsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: "product-1",
          orderId: "order-1",
          quantity: 2,
        }),
      }),
    );
    expect(service.deanonymize).toHaveBeenCalledWith({
      id: "subject-1",
      email: "user@example.test",
    });
    expect(service.ecommerceOrderCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "subject-1",
        provider: "stripe",
        ecommerceModule: {
          orders: [{ id: "order-1" }],
        },
      }),
    );
    expect(context.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        checkoutUrl: "https://example.test/pay",
      }),
    });
  });

  it("When: provider is telegram-star Then: checkout proceeds without deanonymization", async () => {
    const service = createService();
    const handler = new Handler(service);

    const context = createContext(
      { id: "subject-1", productId: "product-1" },
      {
        data: JSON.stringify({
          provider: "telegram-star",
          email: "user@example.test",
          storeId: "store-1",
          billingModule: { currency: { id: "currency-1" } },
        }),
      },
    );

    await handler.execute(context, jest.fn());

    expect(service.deanonymize).not.toHaveBeenCalled();
    expect(service.ecommerceOrderCheckout).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: a quantity of 0, a negative number, a fraction or a value above the
   * maximum.
   * When: the subject checks out the product.
   * Then: the request is refused with a validation error and no order,
   * relation or checkout is created.
   */
  it.each([0, -1, 1.5, quantityBounds.max + 1])(
    "When: the quantity is %p Then: the checkout is refused before anything is written",
    async (quantity) => {
      const service = createService();
      const handler = new Handler(service);

      const context = createContext(
        { id: "subject-1", productId: "product-1" },
        {
          data: JSON.stringify({
            provider: "stripe",
            email: "user@example.test",
            quantity,
            storeId: "store-1",
            billingModule: { currency: { id: "currency-1" } },
          }),
        },
      );

      await expect(handler.execute(context, jest.fn())).rejects.toMatchObject({
        message: expect.stringContaining(
          "Validation error. data.quantity must be a whole number",
        ),
      });
      expect(orderCreateMock).not.toHaveBeenCalled();
      expect(subjectsToOrdersCreateMock).not.toHaveBeenCalled();
      expect(ordersToProductsCreateMock).not.toHaveBeenCalled();
      expect(service.ecommerceOrderCheckout).not.toHaveBeenCalled();
    },
  );
});
