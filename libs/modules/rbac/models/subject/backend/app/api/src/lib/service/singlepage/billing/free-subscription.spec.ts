jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "secret",
}));
import { withConsistencyDatabase } from "@sps/shared-backend-api";
import { Service } from "./free-subscription";

function fixture() {
  const tables: Record<string, any[]> = {
    order: [],
    owners: [],
    lines: [],
    stores: [],
    currencies: [],
    intents: [],
    orderIntents: [],
    intentCurrencies: [],
    invoices: [],
    intentInvoices: [],
    balances: [],
    grants: [],
  };
  let inTransaction = false;
  let tail = Promise.resolve();
  let failFulfillment: "settlement" | "balance" | undefined;
  const catalogStores = [{ id: "store" }];
  const offers = [
    {
      id: "gift-offer",
      productId: "free",
      storeId: "store",
      variant: "default",
      settings: { initialGrant: true, initialGrantLegacyHistory: true },
    },
  ];
  const crud = (table: string) => ({
    find: jest.fn(async (props?: any) =>
      tables[table].filter((row) =>
        (props?.params?.filters?.and ?? []).every((filter: any) =>
          filter.method === "inArray"
            ? filter.value.includes(row[filter.column])
            : row[filter.column] === filter.value,
        ),
      ),
    ),
    findById: jest.fn(async ({ id }) =>
      tables[table].find((row) => row.id === id),
    ),
    create: jest.fn(async ({ data }) => {
      const row = { id: `${table}-${tables[table].length + 1}`, ...data };
      tables[table].push(row);
      return row;
    }),
    update: jest.fn(async ({ id, data }) => {
      const row = tables[table].find((row) => row.id === id);
      Object.assign(row, data);
      return row;
    }),
  });
  const currency = { id: "usd", slug: "usd", isDefault: true };
  const token = { id: "token", slug: "token" };
  const attribute = (type: string, data: object, currencies?: any[]) => ({
    attribute: {
      ...data,
      attributeKeysToAttribute: [{ attributeKey: { type } }],
      attributesToBillingModuleCurrencies: (currencies ?? []).map(
        (billingModuleCurrency) => ({ billingModuleCurrency }),
      ),
    },
  });
  const product = {
    id: "free",
    slug: "free-subscription",
    type: "subscription",
    productsToAttributes: [
      attribute("price", { number: "0" }, [currency]),
      attribute("interval", { string: { en: "day", ru: "day" } }),
      attribute("topup", { number: "3000" }, [token]),
    ],
  };
  const products = [product];
  const order = {
    ...crud("order"),
    lockForLifecycle: jest.fn(async () => undefined),
  };
  const dependencies: any = {
    repository: {
      withSubjectLock: jest.fn((_scope, operation) => {
        const result = tail.then(async () => {
          const snapshot = structuredClone(tables);
          inTransaction = true;
          try {
            return await operation();
          } catch (error) {
            Object.keys(tables).forEach((key) => (tables[key] = snapshot[key]));
            throw error;
          } finally {
            inTransaction = false;
          }
        });
        tail = result.then(
          () => undefined,
          () => undefined,
        );
        return result;
      }),
      lockOrderDelivery: jest.fn(async () => undefined),
    },
    subjectsToIdentities: {
      find: jest.fn(async () => [
        { subjectId: "owner", identityId: "identity" },
      ]),
    },
    subjectsToEcommerceModuleOrders: crud("owners"),
    ecommerceModule: {
      order,
      product: {
        find: jest.fn(async () => products),
        findByIdExtended: jest.fn(async ({ id }) =>
          products.find((row) => row.id === id),
        ),
      },
      storesToProducts: { find: jest.fn(async () => offers) },
      store: {
        findById: jest.fn(async ({ id }) =>
          catalogStores.find((row) => row.id === id),
        ),
        find: jest.fn(async (props: any) => {
          const filter = props.params.filters?.and[0];
          if (filter) {
            return catalogStores.filter((store) => store.id === filter.value);
          }
          return catalogStores.slice(0, props.params.limit);
        }),
      },
      ordersToProducts: crud("lines"),
      storesToOrders: crud("stores"),
      ordersToBillingModuleCurrencies: crud("currencies"),
      ordersToBillingModulePaymentIntents: crud("orderIntents"),
    },
    billingModule: {
      paymentIntent: crud("intents"),
      invoice: crud("invoices"),
      paymentIntentsToCurrencies: crud("intentCurrencies"),
      paymentIntentsToInvoices: crud("intentInvoices"),
    },
    fulfillPaidOrderInTransaction: jest.fn(async ({ orderId }) => {
      expect(inTransaction).toBe(true);
      expect(tables.invoices[0].status).toBe("paid");
      if (failFulfillment === "settlement")
        throw new Error("settlement failure");
      tables.balances.push({ amount: "3000" });
      tables.grants.push({ roleId: "free-role" });
      if (failFulfillment === "balance") throw new Error("balance failure");
      const current = tables.order.find((row) => row.id === orderId);
      Object.assign(current, {
        status: "delivering",
        subscriptionPeriodInvoiceId: tables.invoices[0].id,
      });
      return { accepted: true, extendedOrder: current, status: "delivering" };
    }),
    dispatchPaidEffects: jest.fn(async () => {
      expect(inTransaction).toBe(false);
    }),
  };
  return {
    tables,
    catalogStores,
    offers,
    products,
    product,
    dependencies,
    service: new Service(dependencies),
    failAt: (phase: "settlement" | "balance") => {
      failFulfillment = phase;
    },
  };
}

it("uses only direct Services and dispatches effects after its own transaction", async () => {
  const transport = jest
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("No HTTP in Free bootstrap"));
  try {
    const { service, tables, dependencies } = fixture();
    const result = await service.execute({ id: "owner" });
    expect(result?.billingModule.invoices[0].status).toBe("paid");
    expect(tables.intents).toEqual([
      expect.objectContaining({
        amount: 0,
        status: "succeeded",
        type: "one_off",
      }),
    ]);
    expect(tables.invoices).toEqual([
      expect.objectContaining({ amount: 0, provider: "dummy", status: "paid" }),
    ]);
    expect(tables.balances).toEqual([{ amount: "3000" }]);
    expect(dependencies.dispatchPaidEffects).toHaveBeenCalledTimes(1);
    expect(transport).not.toHaveBeenCalled();
  } finally {
    transport.mockRestore();
  }
});

it("keeps the issuing Store from the saved association when another seller opens a Store", async () => {
  const { service, tables, catalogStores } = fixture();
  await service.execute({ id: "owner" });
  catalogStores.unshift({ id: "retail-store" });
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.stores.map((link) => link.storeId)).toEqual(["store"]);
  expect(tables.balances).toHaveLength(1);
});

it("allows a project with no registration grants", async () => {
  const { service, offers, tables, dependencies } = fixture();
  offers.length = 0;
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.order).toHaveLength(0);
  expect(dependencies.fulfillPaidOrderInTransaction).not.toHaveBeenCalled();
});

it("issues several arbitrary Products from their configured Stores once", async () => {
  const { service, offers, products, catalogStores, tables, dependencies } =
    fixture();
  catalogStores.push({ id: "other-store" });
  products.push({
    ...products[0],
    id: "other-product",
    slug: "arbitrary",
    type: "one_off",
    productsToAttributes: [products[0].productsToAttributes[0]],
  });
  offers.push({
    ...offers[0],
    id: "other-gift",
    productId: "other-product",
    storeId: "other-store",
  });
  const results = [
    await service.execute({ id: "owner" }),
    await service.execute({ id: "owner" }),
  ];
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(results.find(Boolean)?.billingModule.invoices).toHaveLength(2);
  expect(tables.lines.map((line) => line.productId)).toEqual([
    "free",
    "other-product",
  ]);
  expect(tables.stores.map((link) => link.storeId)).toEqual([
    "store",
    "other-store",
  ]);
  expect(
    tables.order.every((order) => order.variant === "registration-grant"),
  ).toBe(true);
  expect(dependencies.fulfillPaidOrderInTransaction).toHaveBeenCalledTimes(2);
});

it("issues the same Product once per marked Store even when one Store has two marked SKUs", async () => {
  const { service, offers, catalogStores, tables } = fixture();
  catalogStores.push({ id: "other-store" });
  offers.push({ ...offers[0], id: "other-offer", storeId: "other-store" });
  offers.push({ ...offers[0], id: "another-sku" });
  await service.execute({ id: "owner" });
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.stores.map((link) => link.storeId).sort()).toEqual([
    "other-store",
    "store",
  ]);
  for (const table of ["order", "lines", "intents", "invoices", "balances"]) {
    expect(tables[table]).toHaveLength(2);
  }
});

it("assigns storeless registration history to the legacy issuer before granting at a second Store", async () => {
  const { service, offers, catalogStores, tables } = fixture();
  await service.execute({ id: "owner" });
  const originalOrder = tables.stores.pop().orderId;
  catalogStores.push({ id: "other-store" });
  offers.unshift({
    ...offers[0],
    id: "other-offer",
    storeId: "other-store",
    settings: { initialGrant: true, initialGrantLegacyHistory: false },
  });
  expect(
    (await service.execute({ id: "owner" }))?.billingModule.invoices,
  ).toHaveLength(1);
  expect(tables.stores).toContainEqual(
    expect.objectContaining({ orderId: originalOrder, storeId: "store" }),
  );
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.order).toHaveLength(2);
});

it("ignores hidden and unmarked offers", async () => {
  const { service, offers, tables } = fixture();
  offers[0].variant = "hidden";
  offers.push({
    ...offers[0],
    id: "ordinary",
    variant: "default",
    settings: { initialGrant: false },
  });
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.order).toHaveLength(0);
});

it("accepts configured credit amounts and currencies instead of a fixed allowance", async () => {
  const { service, product, dependencies } = fixture();
  product.slug = "welcome";
  product.productsToAttributes[2].attribute.number = "175";
  product.productsToAttributes[2].attribute.attributesToBillingModuleCurrencies[0].billingModuleCurrency.slug =
    "credit";
  await service.execute({ id: "owner" });
  expect(dependencies.fulfillPaidOrderInTransaction).toHaveBeenCalledTimes(1);
});

it("serializes simultaneous authentication retries into one complete gift graph", async () => {
  const { service, tables, dependencies } = fixture();
  const results = await Promise.all([
    service.execute({ id: "owner" }),
    service.execute({ id: "owner" }),
    service.activate({ id: "owner" }),
  ]);
  expect(results.filter(Boolean)).toHaveLength(1);
  for (const name of Object.keys(tables)) expect(tables[name]).toHaveLength(1);
  expect(dependencies.fulfillPaidOrderInTransaction).toHaveBeenCalledTimes(1);
});

it.each([
  "completed",
  "delivered",
  "expired",
  "canceled",
  "canceling",
  "requested_cancelation",
])(
  "skips known %s Free history without granting or blocking authentication",
  async (status) => {
    const { service, tables, dependencies } = fixture();
    tables.order.push({
      id: "old-free",
      status,
      type: "history",
      variant: "registration-grant",
    });
    tables.owners.push({
      subjectId: "owner",
      ecommerceModuleOrderId: "old-free",
    });
    tables.lines.push({ orderId: "old-free", productId: "free", quantity: 1 });
    expect(await service.execute({ id: "owner" })).toBeNull();
    expect(dependencies.fulfillPaidOrderInTransaction).not.toHaveBeenCalled();
    expect(tables.balances).toEqual([]);
  },
);

it("an unrelated Pro cart does not replace an initial Free grant", async () => {
  const { service, tables } = fixture();
  tables.order.push({ id: "pro-cart", status: "new" });
  tables.owners.push({
    subjectId: "owner",
    ecommerceModuleOrderId: "pro-cart",
  });
  tables.lines.push({ orderId: "pro-cart", productId: "pro", quantity: 1 });
  await service.execute({ id: "owner" });
  expect(tables.order).toHaveLength(2);
  expect(tables.balances).toEqual([{ amount: "3000" }]);
});

it("resumes one existing zero-price graph without replacing its saved IDs", async () => {
  const { service, tables } = fixture();
  tables.order.push({ id: "partial-order", status: "paying", type: "history" });
  tables.owners.push({
    subjectId: "owner",
    ecommerceModuleOrderId: "partial-order",
  });
  tables.lines.push({
    orderId: "partial-order",
    productId: "free",
    quantity: 1,
  });
  tables.intents.push({
    id: "partial-intent",
    amount: 0,
    status: "processing",
    type: "subscription",
  });
  tables.orderIntents.push({
    orderId: "partial-order",
    billingModulePaymentIntentId: "partial-intent",
  });
  tables.invoices.push({
    id: "partial-invoice",
    amount: 0,
    status: "open",
    provider: "telegram-star",
  });
  tables.intentInvoices.push({
    paymentIntentId: "partial-intent",
    invoiceId: "partial-invoice",
  });
  await service.execute({ id: "owner" });
  expect(tables.order.map((row) => row.id)).toEqual(["partial-order"]);
  expect(tables.intents).toEqual([
    expect.objectContaining({
      id: "partial-intent",
      status: "succeeded",
      type: "one_off",
    }),
  ]);
  expect(tables.invoices).toEqual([
    expect.objectContaining({ id: "partial-invoice", status: "paid" }),
  ]);
});

it.each(["settlement", "balance"] as const)(
  "rolls graph, settlement, grants and credit back after %s failure",
  async (phase) => {
    const { service, tables, dependencies, failAt } = fixture();
    failAt(phase);
    await expect(service.execute({ id: "owner" })).rejects.toThrow(
      `${phase} failure`,
    );
    expect(Object.values(tables).every((rows) => rows.length === 0)).toBe(true);
    expect(dependencies.dispatchPaidEffects).not.toHaveBeenCalled();
  },
);

it("rolls back when a graph link fails", async () => {
  const { service, tables, dependencies } = fixture();
  dependencies.ecommerceModule.ordersToProducts.create.mockRejectedValueOnce(
    new Error("link failure"),
  );
  await expect(service.execute({ id: "owner" })).rejects.toThrow(
    "link failure",
  );
  expect(Object.values(tables).every((rows) => rows.length === 0)).toBe(true);
});

it("does not credit again after an unknown committed response", async () => {
  const { service, tables, dependencies } = fixture();
  dependencies.dispatchPaidEffects.mockRejectedValueOnce(
    new Error("unknown committed response"),
  );
  await expect(service.execute({ id: "owner" })).rejects.toThrow(
    "unknown committed response",
  );
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.balances).toEqual([{ amount: "3000" }]);
  expect(tables.order).toHaveLength(1);
});

it("rejects multiple unaccepted pending Free histories, a nonzero price and guests", async () => {
  const first = fixture();
  for (const id of ["a", "b"]) {
    first.tables.order.push({ id, status: "paying", type: "history" });
    first.tables.owners.push({
      subjectId: "owner",
      ecommerceModuleOrderId: id,
    });
    first.tables.lines.push({ orderId: id, productId: "free", quantity: 1 });
  }
  await expect(first.service.execute({ id: "owner" })).rejects.toThrow(
    "needs reconciliation",
  );
  const second = fixture();
  (second.product.productsToAttributes[0].attribute as any).number = "1";
  await expect(second.service.execute({ id: "owner" })).rejects.toThrow(
    "only zero prices",
  );
  const third = fixture();
  third.dependencies.subjectsToIdentities.find.mockResolvedValue([]);
  await expect(third.service.execute({ id: "owner" })).rejects.toThrow(
    "registered Subject",
  );
});

it.each([undefined, "день"])(
  "uses the canonical billing interval when its Russian display value is %s",
  async (ru) => {
    const { service, product, tables } = fixture();
    (product.productsToAttributes[1].attribute as any).string = {
      en: "day",
      ru,
    };
    await service.execute({ id: "owner" });
    expect(tables.balances).toEqual([{ amount: "3000" }]);
    expect(tables.order).toHaveLength(1);
  },
);

it("rejects a caller-owned ambient transaction before any writes or effects", async () => {
  const { service, dependencies } = fixture();
  await expect(
    withConsistencyDatabase({}, () => service.execute({ id: "owner" })),
  ).rejects.toThrow("must own its outer transaction");
  expect(dependencies.repository.withSubjectLock).not.toHaveBeenCalled();
  expect(dependencies.dispatchPaidEffects).not.toHaveBeenCalled();
});

it("keeps the original Order and grants once from a newly assigned Store", async () => {
  const { service, offers, catalogStores, tables, dependencies } = fixture();
  await service.execute({ id: "owner" });
  offers[0].settings.initialGrant = false;
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.order[0].variant).toBe("registration-grant");
  catalogStores.push({ id: "new-store" });
  offers[0].storeId = "new-store";
  offers[0].settings.initialGrant = true;
  expect(
    (await service.execute({ id: "owner" }))?.billingModule.invoices,
  ).toHaveLength(1);
  expect(tables.stores.map((link) => link.storeId)).toEqual([
    "store",
    "new-store",
  ]);
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(dependencies.fulfillPaidOrderInTransaction).toHaveBeenCalledTimes(2);
});

it("marks an existing zero-price legacy grant without crediting it again", async () => {
  const { service, tables, dependencies } = fixture();
  await service.execute({ id: "owner" });
  tables.order[0].variant = "default";
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.order[0].variant).toBe("registration-grant");
  expect(dependencies.fulfillPaidOrderInTransaction).toHaveBeenCalledTimes(1);
});

it("preserves a pre-existing paid Order when its Product becomes a registration Product", async () => {
  const { service, tables } = fixture();
  await service.execute({ id: "owner" });
  tables.order[0].variant = "default";
  tables.intents[0].amount = 100;
  tables.invoices[0].amount = 100;
  expect(await service.execute({ id: "owner" })).not.toBeNull();
  expect(tables.order).toHaveLength(2);
  expect(tables.order[1].variant).toBe("registration-grant");
  expect(tables.order[0].variant).toBe("default");
});

it.each(["completed", "canceled"])(
  "issues a new grant alongside ordinary %s history for the same Product",
  async (status) => {
    const { service, offers, tables } = fixture();
    offers[0].settings.initialGrantLegacyHistory = false;
    tables.order.push({
      id: "ordinary",
      status,
      type: "history",
      variant: "default",
    });
    tables.owners.push({
      subjectId: "owner",
      ecommerceModuleOrderId: "ordinary",
    });
    tables.lines.push({
      orderId: "ordinary",
      productId: "free",
      offerId: "retail-offer",
      quantity: 1,
    });
    await service.execute({ id: "owner" });
    expect(tables.order).toHaveLength(2);
    expect(tables.order[0].variant).toBe("default");
    expect(tables.balances).toHaveLength(1);
  },
);
