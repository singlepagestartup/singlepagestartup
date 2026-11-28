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
    customerWork: { discussionForOrder: jest.fn() },
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
    customerWork: { discussionForOrder: jest.fn() },
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

it.each([
  { accepted: false, state: "awaiting-result" },
  { accepted: true, state: "awaiting-payment" },
])(
  "returns the linked discussion while work is $state",
  async ({ accepted, state }) => {
    const discussion = {
      storeId: "seller",
      taskId: "task",
      threadId: "thread",
      chatId: "chat",
    };
    const totals = [{ total: 37.5, billingModuleCurrency: { id: "accepted" } }];
    const service: any = {
      ecommerceModuleOrderAssertAccess: jest.fn(),
      ecommerceModuleCartQuote: jest.fn(),
      customerWork: {
        discussionForOrder: jest.fn().mockResolvedValue(discussion),
      },
      modules: {
        ecommerce: {
          order: {
            work: {
              findByOrder: jest.fn().mockResolvedValue({
                customerId: "subject",
                storeId: "seller",
                taskId: "task",
                kind: "individual-service",
              }),
            },
            fulfillmentQuoteOptions: jest
              .fn()
              .mockResolvedValue({ fulfilledLineIds: [] }),
            findByIdCartDetails: jest.fn().mockResolvedValue({
              lines: [],
              ...(accepted
                ? {
                    fixedResultPrice: true,
                    billingModuleCurrencyId: "accepted",
                    totals,
                  }
                : { totals: [] }),
            }),
          },
          storesToOrders: { find: jest.fn().mockResolvedValue([]) },
        },
      },
    };
    const details = await new Service({ service }).execute({
      subjectId: "subject",
      orderId: "order",
    });
    expect(details).toMatchObject({
      work: {
        paymentTiming: "after-acceptance",
        state,
        orderId: "order",
        storeId: "seller",
      },
      discussion,
      ...(accepted ? { billingModuleCurrencyId: "accepted", totals } : {}),
    });
    expect(service.customerWork.discussionForOrder).toHaveBeenCalledWith({
      customerId: "subject",
      orderId: "order",
      taskId: "task",
    });
    expect(service.ecommerceModuleCartQuote).not.toHaveBeenCalled();
  },
);

it.each([false, true])(
  "keeps token-funded cart work outside checkout totals (%s registered)",
  async (registered) => {
    const offer = {
      id: "brief-active",
      productId: "brief",
      storeId: "seller",
      variant: "default",
      settings: {
        standalone: true,
        requiresResultAcceptance: true,
        workTokenPricing: { currencyId: "token", multiplier: "2" },
      },
    };
    const retired = {
      ...offer,
      id: "brief-closed",
      settings: { closedForNewOrders: true, requiresResultAcceptance: true },
    };
    const order = { subjectId: "subject", orderId: "order" };
    const service: any = {
      ecommerceModuleOrderAssertAccess: jest.fn(),
      ecommerceModuleCartQuote: jest
        .fn()
        .mockResolvedValue([
          { amount: "0", issues: [], currencyIds: ["token"] },
        ]),
      customerWork: {
        discussionForOrder: jest.fn(),
        canOpenCartDiscussion: jest.fn().mockResolvedValue(true),
      },
      modules: {
        ecommerce: {
          order: {
            work: {
              findByOrder: jest.fn().mockResolvedValue(
                registered
                  ? {
                      customerId: order.subjectId,
                      kind: "individual-service",
                      storeId: offer.storeId,
                      taskId: "task",
                      paymentMode: "work-tokens",
                    }
                  : null,
              ),
            },
            fulfillmentQuoteOptions: jest.fn().mockResolvedValue({
              fulfilledLineIds: [],
            }),
            findByIdCartDetails: jest.fn().mockResolvedValue({
              lines: [{ id: "line", productId: "brief", offerId: offer.id }],
              billingModuleCurrencyId: "token",
              totals: [{ total: 0, billingModuleCurrency: { id: "token" } }],
            }),
          },
          storesToOrders: {
            find: jest.fn().mockResolvedValue([{ storeId: offer.storeId }]),
          },
          storesToProducts: {
            findById: jest.fn().mockResolvedValue(offer),
            offersForProduct: jest.fn().mockResolvedValue([retired, offer]),
          },
          store: { find: jest.fn().mockResolvedValue([]) },
        },
      },
    };
    const result = await new Service({ service }).execute(order);
    expect(result.offers?.map(({ id }) => id)).toEqual([offer.id]);
    expect(result.totals).toEqual([]);
    expect(result.work).toMatchObject({
      paymentTiming: "work-tokens",
      state: registered ? "awaiting-result" : "requires-discussion",
    });
    service.modules.ecommerce.order.work.findByOrder.mockResolvedValue(null);
    service.modules.ecommerce.order.findByIdCartDetails.mockResolvedValue({
      lines: [{ id: "line", productId: "brief", offerId: retired.id }],
      billingModuleCurrencyId: "rub",
      totals: [{ total: 900, billingModuleCurrency: { id: "rub" } }],
    });
    service.modules.ecommerce.storesToProducts.findById.mockResolvedValue(
      retired,
    );
    const saved = await new Service({ service }).execute(order);
    expect(saved.offers?.map(({ id }) => id)).toContain(retired.id);
    expect(saved.totals[0]?.total).toBe(900);
    expect(saved.work?.paymentTiming).toBe("after-acceptance");
  },
);

it.each([
  { published: true, state: "requires-discussion" },
  { published: false, state: "discussion-unavailable" },
])(
  "marks the saved post-acceptance offer as $state",
  async ({ published, state }) => {
    const offer = {
      id: "offer",
      storeId: "seller",
      variant: "default",
      settings: { requiresResultAcceptance: true },
    };
    const service: any = {
      ecommerceModuleOrderAssertAccess: jest.fn(),
      ecommerceModuleCartQuote: jest
        .fn()
        .mockResolvedValue([
          { amount: "30", issues: [], currencyIds: ["rub"] },
        ]),
      customerWork: {
        discussionForOrder: jest.fn(),
        canOpenCartDiscussion: jest.fn().mockResolvedValue(published),
      },
      modules: {
        ecommerce: {
          order: {
            fulfillmentQuoteOptions: jest
              .fn()
              .mockResolvedValue({ fulfilledLineIds: [] }),
            findByIdCartDetails: jest.fn().mockResolvedValue({
              lines: [{ id: "line", productId: "product", offerId: "offer" }],
              billingModuleCurrencyId: "rub",
            }),
          },
          storesToOrders: {
            find: jest.fn().mockResolvedValue([{ storeId: "seller" }]),
          },
          storesToProducts: {
            findById: jest.fn().mockResolvedValue(offer),
            offersForProduct: jest.fn().mockResolvedValue([offer]),
          },
          store: { find: jest.fn().mockResolvedValue([{ id: "seller" }]) },
        },
      },
    };
    const details = await new Service({ service }).execute({
      subjectId: "subject",
      orderId: "order",
    });
    expect(details.work).toEqual({
      paymentTiming: "after-acceptance",
      state,
      orderId: "order",
      storeId: "seller",
    });
    expect(details.discussion).toBeUndefined();
  },
);
