import { Service } from "./repeat";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";

const props = {
  subjectId: "subject",
  orderId: "history",
};

function fixture() {
  const source = {
    id: "history",
    type: "history",
    status: "paying",
    receipt: "original receipt",
    comment: "original comment",
    subscriptionPeriodInvoiceId: "original-invoice",
  };
  const carts = [
    { id: "cart-z", type: "cart", status: "new" },
    { id: "cart-a", type: "cart", status: "new" },
  ];
  const lines = [
    { id: "line-a", orderId: source.id, productId: "product-a", quantity: 2 },
    { id: "line-b", orderId: source.id, productId: "product-b", quantity: 5 },
  ];
  const service = {
    ecommerceModuleOrderRetryableIds: jest.fn(
      async ({ orders }) =>
        new Set(
          orders
            .filter(
              (order) =>
                order.type === "history" &&
                ["paying", "failed", "canceling", "canceled"].includes(
                  order.status,
                ),
            )
            .map((order) => order.id),
        ),
    ),
    ecommerceModuleOrderAssertAccess: jest.fn().mockResolvedValue(undefined),
    ecommerceModuleResolveOrderCurrency: jest
      .fn()
      .mockResolvedValue("currency"),
    module: {
      subjectsToEcommerceModuleOrders: {
        find: jest.fn(async ({ params }) => {
          const orderId = params.filters.and.find(
            (filter) => filter.column === "ecommerceModuleOrderId",
          )?.value;
          return [source, ...carts]
            .filter((order) => !orderId || order.id === orderId)
            .map((order) => ({
              subjectId: "subject",
              ecommerceModuleOrderId: order.id,
            }));
        }),
        create: jest.fn().mockResolvedValue({ id: "new-owner" }),
      },
    },
    modules: {
      ecommerce: {
        storesToProducts: { find: jest.fn().mockResolvedValue([]) },
        product: {
          findById: jest.fn(
            async ({
              id,
            }: {
              id: string;
            }): Promise<{ id: string; slug: string } | null> => ({
              id,
              slug: id,
            }),
          ),
        },
        store: { findById: jest.fn().mockResolvedValue({ id: "store" }) },
        ordersToProducts: {
          find: jest.fn().mockResolvedValue(lines),
          create: jest.fn().mockResolvedValue({ id: "new-line" }),
        },
        storesToOrders: {
          find: jest
            .fn()
            .mockResolvedValue([{ orderId: source.id, storeId: "store" }]),
          create: jest.fn().mockResolvedValue({ id: "new-store" }),
        },
        ordersToBillingModuleCurrencies: {
          find: jest
            .fn()
            .mockResolvedValue([
              { orderId: source.id, billingModuleCurrencyId: "currency" },
            ]),
          create: jest.fn().mockResolvedValue({ id: "new-currency" }),
        },
        order: {
          find: jest.fn().mockResolvedValue(carts),
          findById: jest.fn(async ({ id }: { id: string }) => {
            return [source, ...carts].find((order) => order.id === id);
          }),
          lockForLifecycle: jest.fn(),
          delete: jest.fn(),
          create: jest.fn().mockResolvedValue({ id: "new-order" }),
          update: jest.fn(),
          findByIdCheckoutAttributesByCurrency: jest.fn().mockResolvedValue({
            amount: 1050,
            type: "one_off",
          }),
          ordersToBillingModulePaymentIntents: {
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
          },
          paymentIntent: {
            findById: jest.fn().mockResolvedValue({ status: "failed" }),
          },
        },
      },
      billing: {
        currency: { findById: jest.fn().mockResolvedValue({ id: "currency" }) },
        paymentIntentsToInvoices: { find: jest.fn().mockResolvedValue([]) },
      },
    },
  };
  const repository = {
    withSubjectLock: jest.fn(async (_scope, operation) => operation()),
  };
  const operation = new Service({ repository, service } as any);
  return { source, carts, lines, service, repository, operation };
}

it.each(["paying", "failed", "canceling", "canceled"])(
  "rebuilds one fresh multiline cart from %s history and replaces all current carts",
  async (status) => {
    const f = fixture();
    f.source.status = status;
    await expect(f.operation.execute(props)).resolves.toEqual({
      orderIds: ["new-order"],
    });
    expect(f.repository.withSubjectLock).toHaveBeenCalledWith(
      { subjectId: props.subjectId },
      expect.any(Function),
    );
    expect(
      f.service.modules.ecommerce.order.lockForLifecycle.mock.calls.map(
        ([scope]) => scope.id,
      ),
    ).toEqual(["cart-a", "cart-z", "history"]);
    expect(f.service.modules.ecommerce.order.delete.mock.calls).toEqual([
      [{ id: "cart-z" }],
      [{ id: "cart-a" }],
    ]);
    expect(f.service.modules.ecommerce.order.create).toHaveBeenCalledWith({
      data: { type: "cart", status: "new" },
    });
    expect(
      f.service.modules.ecommerce.ordersToProducts.create.mock.calls,
    ).toEqual([
      [{ data: { orderId: "new-order", productId: "product-a", quantity: 2 } }],
      [{ data: { orderId: "new-order", productId: "product-b", quantity: 5 } }],
    ]);
    expect(
      f.service.modules.ecommerce.storesToOrders.create,
    ).toHaveBeenCalledWith({
      data: { orderId: "new-order", storeId: "store" },
    });
    expect(
      f.service.modules.ecommerce.ordersToBillingModuleCurrencies.create,
    ).toHaveBeenCalledWith({
      data: { orderId: "new-order", billingModuleCurrencyId: "currency" },
    });
    expect(f.service.modules.ecommerce.order.update).not.toHaveBeenCalled();
    expect(
      f.service.modules.ecommerce.order.ordersToBillingModulePaymentIntents
        .create,
    ).not.toHaveBeenCalled();
    expect(
      f.service.ecommerceModuleResolveOrderCurrency,
    ).toHaveBeenNthCalledWith(2, {
      productId: "product-b",
      billingModuleCurrencyId: "currency",
    });
    expect(
      f.service.ecommerceModuleResolveOrderCurrency.mock.invocationCallOrder[1],
    ).toBeLessThan(
      f.service.modules.ecommerce.order.delete.mock.invocationCallOrder[0],
    );
  },
);

it("rejects access to another subject or source before reading the order graph", async () => {
  const f = fixture();
  f.service.ecommerceModuleOrderAssertAccess.mockRejectedValue(
    new Error("Permission error"),
  );
  await expect(f.operation.execute(props)).rejects.toThrow("Permission error");
  expect(f.service.modules.ecommerce.order.find).not.toHaveBeenCalled();
  expect(
    f.service.modules.ecommerce.ordersToProducts.find,
  ).not.toHaveBeenCalled();
  expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
});

it.each(["cart", "draft"])("rejects a source with type %s", async (type) => {
  const f = fixture();
  f.source.type = type;
  await expect(f.operation.execute(props)).rejects.toThrow(
    "Only an unpaid history order",
  );
  expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
});

it.each([0, -1, 1.5, quantityBounds.max + 1])(
  "preserves the current cart when a later source quantity is invalid: %s",
  async (quantity) => {
    const f = fixture();
    f.lines[1].quantity = quantity;
    await expect(f.operation.execute(props)).rejects.toThrow(
      "Quantity must be an integer",
    );
    expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
    expect(f.service.modules.ecommerce.order.create).not.toHaveBeenCalled();
  },
);

it("rejects Initial Free before replacing the cart", async () => {
  const f = fixture();
  f.service.modules.ecommerce.storesToProducts.find.mockResolvedValue([
    { productId: "product-a", settings: { initialGrant: true } },
  ]);
  f.service.modules.ecommerce.product.findById.mockResolvedValue({
    id: "product-a",
    slug: "welcome",
  });
  await expect(f.operation.execute(props)).rejects.toThrow(
    "authentication bootstrap",
  );
  expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
});

it("keeps the current cart when current product checkout attributes became incompatible", async () => {
  const f = fixture();
  f.service.modules.ecommerce.order.findByIdCheckoutAttributesByCurrency.mockRejectedValue(
    new Error("Not Found error. Order has multiple product types"),
  );
  await expect(f.operation.execute(props)).rejects.toThrow(
    "multiple product types",
  );
  expect(
    f.service.modules.ecommerce.order.findByIdCheckoutAttributesByCurrency,
  ).toHaveBeenCalledWith({
    id: "history",
    billingModuleCurrencyId: "currency",
  });
  expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
  expect(f.service.modules.ecommerce.order.create).not.toHaveBeenCalled();
});

it.each(["products", "product", "store", "currency", "price"])(
  "validates unavailable %s before replacing the cart",
  async (missing) => {
    const f = fixture();
    if (missing === "products") {
      f.service.modules.ecommerce.ordersToProducts.find.mockResolvedValue([]);
    }
    if (missing === "product") {
      f.service.modules.ecommerce.product.findById.mockResolvedValueOnce(null);
    }
    if (missing === "store") {
      f.service.modules.ecommerce.store.findById.mockResolvedValue(null);
    }
    if (missing === "currency") {
      f.service.modules.billing.currency.findById.mockResolvedValue(null);
    }
    if (missing === "price") {
      f.service.ecommerceModuleResolveOrderCurrency.mockRejectedValueOnce(
        new Error("Validation error. Price removed"),
      );
    }
    await expect(f.operation.execute(props)).rejects.toThrow(
      "Validation error",
    );
    expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
    expect(f.service.modules.ecommerce.order.create).not.toHaveBeenCalled();
  },
);

it.each(["store", "currency"])(
  "preserves the cart if the source has ambiguous %s links",
  async (association) => {
    const f = fixture();
    if (association === "store") {
      f.service.modules.ecommerce.storesToOrders.find.mockResolvedValue([
        { storeId: "store" },
        { storeId: "another-store" },
      ]);
    } else {
      f.service.modules.ecommerce.ordersToBillingModuleCurrencies.find.mockResolvedValue(
        [
          { billingModuleCurrencyId: "currency" },
          { billingModuleCurrencyId: "another-currency" },
        ],
      );
    }
    await expect(f.operation.execute(props)).rejects.toThrow(
      `one ${association}`,
    );
    expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
    expect(f.service.modules.ecommerce.order.create).not.toHaveBeenCalled();
  },
);

it("leaves an order that became history under its lifecycle lock untouched", async () => {
  const f = fixture();
  f.service.modules.ecommerce.order.findById.mockImplementation(
    async ({ id }) => {
      if (id === "cart-z") {
        return { id, type: "history", status: "paying" };
      }
      return [f.source, ...f.carts].find((order) => order.id === id);
    },
  );
  await f.operation.execute(props);
  expect(f.service.modules.ecommerce.order.delete).toHaveBeenCalledTimes(1);
  expect(f.service.modules.ecommerce.order.delete).toHaveBeenCalledWith({
    id: "cart-a",
  });
});

it("preserves the complete cart even when its payment intent failed without an invoice", async () => {
  const f = fixture();
  f.service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
    [{ billingModulePaymentIntentId: "failed-intent" }],
  );
  await expect(f.operation.execute(props)).rejects.toThrow(
    "payment attempt and cannot be replaced",
  );
  expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
  expect(f.service.modules.ecommerce.order.create).not.toHaveBeenCalled();
  expect(
    f.service.modules.ecommerce.order.paymentIntent.findById,
  ).not.toHaveBeenCalled();
});

it.each([
  "new",
  "paid",
  "approving",
  "packaging",
  "delivering",
  "delivered",
  "completed",
  "expired",
  "requested_cancelation",
])("preserves both orders for a non-retryable %s source", async (status) => {
  const f = fixture();
  f.source.status = status;
  await expect(f.operation.execute(props)).rejects.toThrow(
    "Only an unpaid history order",
  );
  expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
  expect(f.service.modules.ecommerce.order.update).not.toHaveBeenCalled();
});

it.each(["history", "cart-a"])(
  "rejects a shared %s order before deleting anything",
  async (orderId) => {
    const f = fixture();
    const find =
      f.service.module.subjectsToEcommerceModuleOrders.find.getMockImplementation()!;
    f.service.module.subjectsToEcommerceModuleOrders.find.mockImplementation(
      async (query) => {
        const rows = await find(query);
        if (
          query.params.filters.and.some(
            (filter) =>
              filter.column === "ecommerceModuleOrderId" &&
              filter.value === orderId,
          )
        ) {
          rows.push({
            subjectId: "another-subject",
            ecommerceModuleOrderId: orderId,
          });
        }
        return rows;
      },
    );
    await expect(f.operation.execute(props)).rejects.toThrow(
      "only to the current subject",
    );
    expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
  },
);

it("strips a retired pickup point from the new cart without changing the historical line", async () => {
  const f = fixture();
  const destination = {
    address: "Existing delivery address",
    region: "Existing region",
    pickupPointId: "other-store-point",
  };
  const source = {
    ...f.lines[0],
    offerId: "offer-a",
    destination,
    parentLineId: null,
    recurrence: "each",
    quoteVersion: "accepted-old-version",
  };
  f.service.modules.ecommerce.ordersToProducts.find.mockResolvedValue([source]);
  await f.operation.execute(props);
  expect(
    f.service.modules.ecommerce.ordersToProducts.create,
  ).toHaveBeenCalledWith({
    data: expect.objectContaining({
      destination: { address: destination.address, region: destination.region },
    }),
  });
  expect(source.destination).toEqual(destination);
  expect(source.destination.pickupPointId).toBe("other-store-point");
  expect(f.service.modules.ecommerce.order.update).not.toHaveBeenCalled();
});
