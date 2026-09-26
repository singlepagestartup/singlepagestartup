/**
 * BDD Suite: rbac ecommerce order create controller behavior.
 *
 * Given: create handler dependencies are mocked with a subject, a store and no existing cart order.
 * When: the subject adds a product to its cart with or without a quantity.
 * Then: the order line is created with a whole-number quantity within the bounds, and any other
 * quantity is refused before anything is read or written.
 */

const authorizationMock = jest.fn();
const verifyMock = jest.fn();
const orderCreateMock = jest.fn();
const subjectsToOrdersCreateMock = jest.fn();
const ordersToProductsCreateMock = jest.fn();
const storesToOrdersCreateMock = jest.fn();
const ordersToBillingCurrenciesCreateMock = jest.fn();

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
import { Handler } from "./create";

function createContext(data: Record<string, unknown>) {
  return {
    req: {
      param: (name: string) => (name === "id" ? "subject-1" : undefined),
      parseBody: jest.fn().mockResolvedValue({ data: JSON.stringify(data) }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    findById: jest.fn().mockResolvedValue({ id: "subject-1" }),
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
      ordersToProducts: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
    subjectsToEcommerceModuleOrders: {
      find: jest.fn().mockResolvedValue([]),
    },
    billingModule: {
      currency: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
  } as any;
}

describe("Given: ecommerce order create handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
    orderCreateMock.mockResolvedValue({ id: "order-1" });
    subjectsToOrdersCreateMock.mockResolvedValue({ id: "sto-1" });
    ordersToProductsCreateMock.mockResolvedValue({ id: "otp-1" });
    storesToOrdersCreateMock.mockResolvedValue({ id: "s2o-1" });
    ordersToBillingCurrenciesCreateMock.mockResolvedValue({ id: "otbc-1" });
  });

  /**
   * BDD Scenario
   * Given: a request with a quantity of 2.
   * When: the subject adds the product to its cart.
   * Then: the order line is created with quantity 2.
   */
  it("When: the quantity is a whole number within the bounds Then: the line is created with it", async () => {
    await new Handler(createService()).execute(
      createContext({ productId: "product-1", quantity: 2 }),
      jest.fn(),
    );

    expect(ordersToProductsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "order-1",
          productId: "product-1",
          quantity: 2,
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a request without a quantity.
   * When: the subject adds the product to its cart.
   * Then: the order line is created with quantity 1.
   */
  it("When: the quantity is absent Then: the line is created with quantity 1", async () => {
    await new Handler(createService()).execute(
      createContext({ productId: "product-1" }),
      jest.fn(),
    );

    expect(ordersToProductsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quantity: 1 }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a quantity of 0, a negative number, a fraction, a value above the
   * maximum or a numeric string.
   * When: the subject adds the product to its cart.
   * Then: the request is refused with a validation error and nothing is read
   * or written.
   */
  it.each([0, -1, 1.5, quantityBounds.max + 1, "2"])(
    "When: the quantity is %p Then: the request is refused before anything is written",
    async (quantity) => {
      const service = createService();

      await expect(
        new Handler(service).execute(
          createContext({ productId: "product-1", quantity }),
          jest.fn(),
        ),
      ).rejects.toMatchObject({
        message: expect.stringContaining(
          "Validation error. data.quantity must be a whole number",
        ),
      });

      expect(service.ecommerceModule.store.find).not.toHaveBeenCalled();
      expect(service.findById).not.toHaveBeenCalled();
      expect(orderCreateMock).not.toHaveBeenCalled();
      expect(subjectsToOrdersCreateMock).not.toHaveBeenCalled();
      expect(ordersToProductsCreateMock).not.toHaveBeenCalled();
    },
  );
});
