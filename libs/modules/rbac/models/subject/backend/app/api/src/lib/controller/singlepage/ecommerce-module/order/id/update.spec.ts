/**
 * BDD Suite: rbac ecommerce order update controller behavior.
 *
 * Given: update handler dependencies are mocked with deterministic order state.
 * When: subject updates cart order lines.
 * Then: owner checks are enforced and update API receives submitted payload.
 */

const authorizationMock = jest.fn();
const verifyMock = jest.fn();
const orderUpdateMock = jest.fn();

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
  verifyJwt: jest.requireActual("@sps/backend-utils").verifyJwt,
}));

jest.mock("hono/jwt", () => ({
  verify: (...args: unknown[]) => verifyMock(...args),
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    update: (...args: unknown[]) => orderUpdateMock(...args),
  },
}));

import { Handler } from "./update";

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
    ecommerceModuleOrderSetCurrency: jest.fn().mockResolvedValue(undefined),
    ecommerceModuleOrderAssertAccess: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue({ id: "subject-1" }),
    ecommerceModule: {
      ordersToProducts: {
        find: jest
          .fn()
          .mockResolvedValue([{ id: "otp-1", productId: "product-1" }]),
      },
      product: {
        findById: jest
          .fn()
          .mockResolvedValue({ id: "product-1", slug: "paid-course" }),
      },
      order: {
        findById: jest.fn().mockResolvedValue({
          id: "order-1",
          status: "new",
        }),
      },
    },
  } as any;
}

describe("Given: ecommerce order update handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
    orderUpdateMock.mockResolvedValue({ id: "order-1" });
  });

  it("When: request subject does not own order Then: update is rejected", async () => {
    verifyMock.mockResolvedValue({ subject: { id: "another-subject" } });

    const handler = new Handler(createService());
    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      {
        data: JSON.stringify({
          ordersToProducts: [{ id: "otp-1", quantity: 3 }],
        }),
      },
    );

    await expect(handler.execute(context, jest.fn())).rejects.toBeTruthy();
    expect(orderUpdateMock).not.toHaveBeenCalled();
  });

  it("When: request is valid Then: order update API is called and subject is returned", async () => {
    const handler = new Handler(createService());
    const updatePayload = {
      ordersToProducts: [{ id: "otp-1", quantity: 3 }],
    };

    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      { data: JSON.stringify(updatePayload) },
    );

    await handler.execute(context, jest.fn());

    expect(orderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "order-1",
        data: updatePayload,
      }),
    );
    expect(context.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "subject-1" }),
    });
  });
  it("ignores injected order state and line ownership fields", async () => {
    const service = createService();
    const context = createContext(
      { id: "subject-1", orderId: "order-1" },
      {
        data: JSON.stringify({
          status: "paid",
          ordersToProducts: [
            {
              id: "otp-1",
              quantity: 2,
              orderId: "foreign",
              productId: "other",
            },
          ],
        }),
      },
    );
    await new Handler(service).execute(context, jest.fn());
    expect(service.ecommerceModuleOrderAssertAccess).toHaveBeenCalledWith({
      subjectId: "subject-1",
      orderId: "order-1",
      lineIds: ["otp-1"],
    });
    expect(orderUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { ordersToProducts: [{ id: "otp-1", quantity: 2 }] },
      }),
    );
  });
});

describe("Cart currency requests", () => {
  const currencyId = "11111111-1111-4111-8111-111111111111";
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
  });
  it("accepts a currency-only update without requiring quantity changes", async () => {
    const service = createService();
    await new Handler(service).execute(
      createContext(
        { id: "subject-1", orderId: "order-1" },
        {
          data: JSON.stringify({
            billingModule: { currency: { id: currencyId } },
          }),
        },
      ),
      jest.fn(),
    );
    expect(service.ecommerceModuleOrderSetCurrency).toHaveBeenCalledWith({
      subjectId: "subject-1",
      orderId: "order-1",
      currencyId,
    });
    expect(orderUpdateMock).not.toHaveBeenCalled();
  });
  it.each(["invalid", null])(
    "rejects invalid currency %s before writes",
    async (id) => {
      const service = createService();
      await expect(
        new Handler(service).execute(
          createContext(
            { id: "subject-1", orderId: "order-1" },
            { data: JSON.stringify({ billingModule: { currency: { id } } }) },
          ),
          jest.fn(),
        ),
      ).rejects.toThrow("valid billingModule.currency.id");
      expect(service.ecommerceModuleOrderSetCurrency).not.toHaveBeenCalled();
      expect(orderUpdateMock).not.toHaveBeenCalled();
    },
  );
  it("rejects a combined currency/quantity payload before either operation", async () => {
    const service = createService();
    await expect(
      new Handler(service).execute(
        createContext(
          { id: "subject-1", orderId: "order-1" },
          {
            data: JSON.stringify({
              billingModule: { currency: { id: currencyId } },
              ordersToProducts: [{ id: "line", quantity: 3 }],
            }),
          },
        ),
        jest.fn(),
      ),
    ).rejects.toThrow("separately from quantity");
    expect(service.ecommerceModuleOrderSetCurrency).not.toHaveBeenCalled();
    expect(orderUpdateMock).not.toHaveBeenCalled();
  });
});
