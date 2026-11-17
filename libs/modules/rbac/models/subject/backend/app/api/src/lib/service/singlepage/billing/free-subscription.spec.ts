jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  ECOMMERCE_INITIAL_FREE_STORE_ID: undefined,
  RBAC_SECRET_KEY: "secret",
}));
import { withConsistencyDatabase } from "@sps/shared-backend-api";
import { INITIAL_FREE_SEEDED_STORE_ID } from "@sps/shared-utils";
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
        find: jest.fn(async () => [product]),
        findByIdExtended: jest.fn(async () => product),
      },
      store: {
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

it("keeps the initial Free order at the seeded Store when another seller opens a Store", async () => {
  const { service, tables, catalogStores } = fixture();
  catalogStores[0].id = INITIAL_FREE_SEEDED_STORE_ID;
  await service.execute({ id: "owner" });
  catalogStores.unshift({ id: "retail-store" });
  expect(await service.execute({ id: "owner" })).toBeNull();
  expect(tables.stores.map((link) => link.storeId)).toEqual([
    INITIAL_FREE_SEEDED_STORE_ID,
  ]);
  expect(tables.balances).toHaveLength(1);
});

it("requires an explicit issuing Store when several custom Stores exist", async () => {
  const { service, tables, catalogStores } = fixture();
  catalogStores.push({ id: "retail-store" });
  await expect(service.execute({ id: "owner" })).rejects.toThrow(
    "ECOMMERCE_INITIAL_FREE_STORE_ID",
  );
  expect(tables.order).toHaveLength(0);
});

it("requires the configured issuing Store even when another Store is available", async () => {
  const shared = jest.requireMock("@sps/shared-utils");
  const configured = jest.replaceProperty(
    shared,
    "ECOMMERCE_INITIAL_FREE_STORE_ID",
    "issuer",
  );
  try {
    const { service, tables, catalogStores } = fixture();
    await expect(service.execute({ id: "owner" })).rejects.toThrow(
      "ECOMMERCE_INITIAL_FREE_STORE_ID",
    );
    catalogStores.push({ id: "issuer" });
    await service.execute({ id: "owner" });
    expect(tables.stores.map((link) => link.storeId)).toEqual(["issuer"]);
  } finally {
    configured.restore();
  }
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
    tables.order.push({ id: "old-free", status });
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
  tables.order.push({ id: "partial-order", status: "paying" });
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
    first.tables.order.push({ id, status: "paying" });
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
