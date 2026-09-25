/**
 * BDD Suite: add-to-cart write ordering.
 *
 * Given: a subject adds a product to the cart through the subject order create route.
 * When: the order currency cannot be resolved for that product.
 * Then: the request is rejected before the first row is written, so no partial order graph survives.
 */

const authorizationMock = jest.fn();
const verifyMock = jest.fn();
const orderCreateMock = jest.fn();
const subjectsToEcommerceModuleOrdersCreateMock = jest.fn();
const ordersToProductsCreateMock = jest.fn();
const storesToOrdersCreateMock = jest.fn();
const ordersToBillingModuleCurrenciesCreateMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  authorization: (...args: unknown[]) => authorizationMock(...args),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("hono/jwt", () => ({
  verify: (...args: unknown[]) => verifyMock(...args),
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

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => orderCreateMock(...args),
  },
}));

jest.mock(
  "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) =>
        subjectsToEcommerceModuleOrdersCreateMock(...args),
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
        ordersToBillingModuleCurrenciesCreateMock(...args),
    },
  }),
);

import { Handler } from "./create";

const NO_PRICE_ERROR =
  "Validation error. Product has no price in an available currency";

function createContext() {
  return {
    req: {
      param: (name: string) => (name === "id" ? "subject-1" : undefined),
      parseBody: jest.fn().mockResolvedValue({
        data: JSON.stringify({
          productId: "product-unpriced",
          quantity: 1,
        }),
      }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(props?: { resolveOrderCurrency?: jest.Mock }) {
  const ecommerceModuleResolveOrderCurrency =
    props?.resolveOrderCurrency ??
    jest.fn().mockRejectedValue(new Error(NO_PRICE_ERROR));

  return {
    ecommerceModuleResolveOrderCurrency,
    service: {
      ecommerceModuleResolveOrderCurrency,
      findById: jest.fn().mockResolvedValue({ id: "subject-1" }),
      subjectsToEcommerceModuleOrders: {
        find: jest.fn().mockResolvedValue([]),
      },
      ecommerceModule: {
        store: {
          find: jest.fn().mockResolvedValue([{ id: "store-1" }]),
        },
        ordersToProducts: { find: jest.fn().mockResolvedValue([]) },
        order: { find: jest.fn().mockResolvedValue([]) },
        storesToOrders: { find: jest.fn().mockResolvedValue([]) },
        ordersToBillingModuleCurrencies: {
          find: jest.fn().mockResolvedValue([]),
        },
      },
    } as any,
  };
}

function expectNoWrites() {
  expect(orderCreateMock).not.toHaveBeenCalled();
  expect(subjectsToEcommerceModuleOrdersCreateMock).not.toHaveBeenCalled();
  expect(ordersToProductsCreateMock).not.toHaveBeenCalled();
  expect(storesToOrdersCreateMock).not.toHaveBeenCalled();
  expect(ordersToBillingModuleCurrenciesCreateMock).not.toHaveBeenCalled();
}

describe("Given: a subject adding a product with no price in an available currency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
  });

  /**
   * BDD Scenario: rejected add-to-cart leaves nothing behind.
   *
   * Given: currency resolution rejects for the requested product.
   * When: the create handler runs.
   * Then: it fails with the validation error and none of the order rows are written.
   */
  it("When: the create handler runs Then: it rejects and writes no order rows", async () => {
    const { service } = createService();
    const handler = new Handler(service);

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      NO_PRICE_ERROR,
    );

    expectNoWrites();
  });

  /**
   * BDD Scenario: the reads that preceded the writes are untouched.
   *
   * Given: currency resolution rejects for the requested product.
   * When: the create handler runs.
   * Then: store resolution and the subject lookup still run, and only the writes are skipped.
   */
  it("When: currency resolution fails Then: store and subject reads still run and no write follows", async () => {
    const { service } = createService();
    const handler = new Handler(service);

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      NO_PRICE_ERROR,
    );

    expect(service.ecommerceModule.store.find).toHaveBeenCalled();
    expect(service.findById).toHaveBeenCalledWith({ id: "subject-1" });
    expectNoWrites();
  });

  /**
   * BDD Scenario: the requested currency reaches the resolution.
   *
   * Given: the request body carries a billing currency id.
   * When: the create handler runs.
   * Then: the resolution is asked for that product and that currency.
   */
  it("When: the request carries a currency Then: resolution receives the product and the requested currency", async () => {
    const { service, ecommerceModuleResolveOrderCurrency } = createService();
    const handler = new Handler(service);
    const c = createContext();

    c.req.parseBody = jest.fn().mockResolvedValue({
      data: JSON.stringify({
        productId: "product-unpriced",
        billingModule: { currency: { id: "currency-requested" } },
      }),
    });

    await expect(handler.execute(c, jest.fn())).rejects.toThrow(NO_PRICE_ERROR);

    expect(ecommerceModuleResolveOrderCurrency).toHaveBeenCalledWith({
      productId: "product-unpriced",
      billingModuleCurrencyId: "currency-requested",
    });
    expectNoWrites();
  });
});
