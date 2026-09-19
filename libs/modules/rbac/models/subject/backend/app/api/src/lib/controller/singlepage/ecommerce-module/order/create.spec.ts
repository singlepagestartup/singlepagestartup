/**
 * BDD Suite: add-to-cart guards and write ordering.
 *
 * Given: a subject adds a product to the cart through the subject order create route.
 * When: the product is already in an open cart, or its order currency cannot be resolved.
 * Then: the request is rejected before the first row is written, so no partial or duplicate order graph survives.
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

const ALREADY_IN_CART_ERROR =
  "Validation error. Product is already in the cart";

type ISubjectOrder = {
  id: string;
  type: string;
  status: string;
  productIds: string[];
};

function createContext(productId = "product-unpriced") {
  return {
    req: {
      param: (name: string) => (name === "id" ? "subject-1" : undefined),
      parseBody: jest.fn().mockResolvedValue({
        data: JSON.stringify({
          productId,
          quantity: 1,
        }),
      }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

/**
 * Mirrors the contract of `ecommerceModuleFindOpenCartOrderWithProduct`: it
 * answers with the order that blocks the add, and an open cart is `type: "cart"`
 * with `status: "new"`. The service's own spec covers how it reaches that answer.
 */
function createFindOpenCartOrderWithProduct(orders: ISubjectOrder[]) {
  return jest.fn(async (props: { subjectId: string; productId: string }) => {
    const blocking = orders.find(
      (order) =>
        order.type === "cart" &&
        order.status === "new" &&
        order.productIds.includes(props.productId),
    );

    return blocking?.id ?? null;
  });
}

function createService(props?: {
  resolveOrderCurrency?: jest.Mock;
  subjectOrders?: ISubjectOrder[];
}) {
  const ecommerceModuleResolveOrderCurrency =
    props?.resolveOrderCurrency ??
    jest.fn().mockRejectedValue(new Error(NO_PRICE_ERROR));
  const ecommerceModuleFindOpenCartOrderWithProduct =
    createFindOpenCartOrderWithProduct(props?.subjectOrders ?? []);

  return {
    ecommerceModuleResolveOrderCurrency,
    ecommerceModuleFindOpenCartOrderWithProduct,
    service: {
      ecommerceModuleResolveOrderCurrency,
      ecommerceModuleFindOpenCartOrderWithProduct,
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

describe("Given: a subject adding a product it may already hold", () => {
  const PRICED_PRODUCT = "product-priced";

  function createPricedService(subjectOrders: ISubjectOrder[]) {
    return createService({
      resolveOrderCurrency: jest.fn().mockResolvedValue("currency-1"),
      subjectOrders,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
    orderCreateMock.mockResolvedValue({ id: "order-new" });
    subjectsToEcommerceModuleOrdersCreateMock.mockResolvedValue({
      id: "subject-to-order-new",
    });
    ordersToProductsCreateMock.mockResolvedValue({
      id: "order-to-product-new",
    });
    storesToOrdersCreateMock.mockResolvedValue({ id: "store-to-order-new" });
    ordersToBillingModuleCurrenciesCreateMock.mockResolvedValue({
      id: "order-to-currency-new",
    });
  });

  /**
   * BDD Scenario: the same product is refused while it sits in an open cart.
   *
   * Given: the subject holds the product in a cart order with status new.
   * When: the create handler runs for that product.
   * Then: it fails with the already-in-cart validation error and writes no order rows.
   */
  it("When: the product is already in an open cart Then: the request is refused and no order rows are written", async () => {
    const { service } = createPricedService([
      {
        id: "order-open",
        type: "cart",
        status: "new",
        productIds: [PRICED_PRODUCT],
      },
    ]);
    const handler = new Handler(service);

    await expect(
      handler.execute(createContext(PRICED_PRODUCT), jest.fn()),
    ).rejects.toThrow(ALREADY_IN_CART_ERROR);

    expectNoWrites();
  });

  /**
   * BDD Scenario: the guard runs before the currency is resolved.
   *
   * Given: the subject holds the product in a cart order with status new.
   * When: the create handler runs for that product.
   * Then: the duplicate is refused without asking for an order currency.
   */
  it("When: the product is already in an open cart Then: no currency is resolved", async () => {
    const { service, ecommerceModuleResolveOrderCurrency } =
      createPricedService([
        {
          id: "order-open",
          type: "cart",
          status: "new",
          productIds: [PRICED_PRODUCT],
        },
      ]);
    const handler = new Handler(service);

    await expect(
      handler.execute(createContext(PRICED_PRODUCT), jest.fn()),
    ).rejects.toThrow(ALREADY_IN_CART_ERROR);

    expect(ecommerceModuleResolveOrderCurrency).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a checked-out order does not block a repeat purchase.
   *
   * Given: the subject holds the product only in a paid order that checkout moved to history.
   * When: the create handler runs for that product.
   * Then: the add succeeds and the full order graph is written.
   */
  it("When: the product sits only in a paid order Then: the add is allowed", async () => {
    const { service } = createPricedService([
      {
        id: "order-paid",
        type: "history",
        status: "paying",
        productIds: [PRICED_PRODUCT],
      },
    ]);
    const handler = new Handler(service);

    await handler.execute(createContext(PRICED_PRODUCT), jest.fn());

    expect(orderCreateMock).toHaveBeenCalled();
    expect(ordersToProductsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ productId: PRICED_PRODUCT }),
      }),
    );
  });

  /**
   * BDD Scenario: a cancelled cart order does not block a new one.
   *
   * Given: the subject holds the product in a cart order that is no longer new.
   * When: the create handler runs for that product.
   * Then: the add is allowed.
   */
  it("When: the product sits only in a cancelled cart order Then: the add is allowed", async () => {
    const { service } = createPricedService([
      {
        id: "order-canceled",
        type: "cart",
        status: "canceled",
        productIds: [PRICED_PRODUCT],
      },
    ]);
    const handler = new Handler(service);

    await handler.execute(createContext(PRICED_PRODUCT), jest.fn());

    expect(orderCreateMock).toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a different product is unaffected by an occupied cart.
   *
   * Given: the subject holds another product in an open cart order.
   * When: the create handler runs for a product that cart does not hold.
   * Then: the add is allowed and the guard was asked about the requested product.
   */
  it("When: a different product is requested Then: the add is allowed and the guard is asked for that product", async () => {
    const { service, ecommerceModuleFindOpenCartOrderWithProduct } =
      createPricedService([
        {
          id: "order-open",
          type: "cart",
          status: "new",
          productIds: ["product-other"],
        },
      ]);
    const handler = new Handler(service);

    await handler.execute(createContext(PRICED_PRODUCT), jest.fn());

    expect(ecommerceModuleFindOpenCartOrderWithProduct).toHaveBeenCalledWith({
      subjectId: "subject-1",
      productId: PRICED_PRODUCT,
    });
    expect(orderCreateMock).toHaveBeenCalled();
  });
});
