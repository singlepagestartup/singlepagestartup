import { Service } from "./cart-details";

it("keeps an unavailable offer in its own row while quoting the remaining legacy products", async () => {
  const hidden = {
    id: "hidden-offer",
    productId: "first",
    storeId: "store",
    variant: "hidden",
    configurationKey: "oak",
    settings: {},
  };
  const available = {
    id: "available-offer",
    productId: "second",
    storeId: "store",
    variant: "default",
    configurationKey: "oak",
    settings: {},
  };
  const quote = {
    offerId: available.id,
    productId: "second",
    currencyIds: ["rub"],
    amount: "7000",
    issues: [],
  };
  const service: any = {
    ecommerceModuleOrderAssertAccess: jest.fn(),
    ecommerceModuleCartQuote: jest.fn().mockResolvedValue([quote]),
    modules: {
      ecommerce: {
        order: {
          fulfillmentQuoteOptions: jest
            .fn()
            .mockResolvedValue({ fulfilledLineIds: [] }),
          findByIdCartDetails: jest.fn().mockResolvedValue({
            lines: [
              {
                id: "first-line",
                productId: "first",
                offerId: hidden.id,
                quantity: 1,
                destination: {},
                product: { kind: "physical" },
              },
              {
                id: "second-line",
                productId: "second",
                offerId: available.id,
                quantity: 1,
                destination: {},
                product: { kind: "physical" },
              },
            ],
            totals: [{ total: 7000 }],
            billingModuleCurrencyId: "rub",
          }),
        },
        storesToOrders: {
          find: jest.fn().mockResolvedValue([{ storeId: "store" }]),
        },
        storesToProducts: {
          findById: jest.fn(async ({ id }) =>
            id === hidden.id ? hidden : available,
          ),
          offersForProduct: jest.fn(async ({ productId }) =>
            productId === "second" ? [available] : [],
          ),
        },
        store: { find: jest.fn().mockResolvedValue([{ id: "store" }]) },
      },
    },
  };
  const details = await new Service({ service }).execute({
    subjectId: "subject",
    orderId: "legacy-order",
  });
  expect(details.lines).toHaveLength(2);
  expect(details.unpriced).toContainEqual(
    expect.objectContaining({
      ordersToProductsId: "first-line",
      reason: expect.stringContaining("no longer available"),
    }),
  );
  expect(details.offerQuotes).toEqual([quote]);
  expect(service.ecommerceModuleCartQuote).toHaveBeenCalledWith(
    expect.objectContaining({
      selections: [expect.objectContaining({ offerId: available.id })],
    }),
  );
});

it("reports the same incomplete delivery once when both total and offer quote explain it", async () => {
  const line = {
    id: "line",
    productId: "product",
    offerId: "offer",
    quantity: 1,
    destination: {},
  };
  const offer = {
    id: "offer",
    productId: "product",
    storeId: "store",
    variant: "default",
    settings: {},
  };
  const reason = "Select a delivery method";
  const service: any = {
    ecommerceModuleOrderAssertAccess: jest.fn(),
    ecommerceModuleCartQuote: jest.fn().mockResolvedValue([
      {
        amount: null,
        currencyIds: ["rub"],
        issues: [{ code: "delivery_required", message: reason }],
      },
    ]),
    modules: {
      ecommerce: {
        order: {
          fulfillmentQuoteOptions: jest
            .fn()
            .mockResolvedValue({ fulfilledLineIds: [] }),
          findByIdCartDetails: jest.fn().mockResolvedValue({
            lines: [line],
            unpriced: [
              { ordersToProductsId: "line", productId: "product", reason },
            ],
            billingModuleCurrencyId: "rub",
          }),
        },
        storesToOrders: { find: jest.fn().mockResolvedValue([]) },
        storesToProducts: {
          findById: jest.fn().mockResolvedValue(offer),
          offersForProduct: jest.fn().mockResolvedValue([offer]),
        },
        store: { find: jest.fn().mockResolvedValue([]) },
      },
    },
  };
  const details = await new Service({ service }).execute({
    subjectId: "subject",
    orderId: "order",
  });
  expect(details.unpriced).toEqual([
    { ordersToProductsId: "line", productId: "product", reason },
  ]);
});
