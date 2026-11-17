/** Real PostgreSQL transactions; the tariff adapter returns deterministic quotes. */
import { randomUUID } from "node:crypto";
import { sign } from "hono/jwt";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { CRUDService } from "@sps/shared-backend-api";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Service as Selection } from "./selection";
import { Service as CheckoutLegacy } from "./checkout-legacy";
import { Service as Access } from "./access";
import { Service as MergeGuestCart } from "./merge-guest-cart";
import type { IEcommerceCartSelection } from "@sps/rbac/models/subject/sdk/model";

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of cleanup.splice(0).reverse()) {
    await remove();
  }
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const suffix = randomUUID();
  const subjects = new SubjectRepository(new SubjectConfiguration());
  const subject = await subjects.insert({
    slug: `issue414-selection-${suffix}`,
  });
  cleanup.push(() => subjects.deleteFirstByField("id", subject.id));
  const paths = {
    product: "@sps/ecommerce/models/product",
    store: "@sps/ecommerce/models/store",
    currency: "@sps/billing/models/currency",
    order: "@sps/ecommerce/models/order",
    owner: "@sps/rbac/relations/subjects-to-ecommerce-module-orders",
    line: "@sps/ecommerce/relations/orders-to-products",
    storeLink: "@sps/ecommerce/relations/stores-to-orders",
    currencyLink:
      "@sps/ecommerce/relations/orders-to-billing-module-currencies",
    offer: "@sps/ecommerce/relations/stores-to-products",
    payment:
      "@sps/ecommerce/relations/orders-to-billing-module-payment-intents",
  };
  const services: Record<keyof typeof paths, any> = {} as any;
  for (const [key, path] of Object.entries(paths)) {
    const { Repository } = await import(
      `${path}/backend/app/api/src/lib/repository`
    );
    const { Configuration } = await import(
      `${path}/backend/app/api/src/lib/configuration`
    );
    const repository = new Repository(new Configuration());
    const service: any = new CRUDService(repository);
    const create = service.create.bind(service);
    service.create = async (props: any) => {
      const record = await create(props);
      cleanup.push(async () => {
        if (await repository.findFirstByField("id", record.id)) {
          await repository.deleteFirstByField("id", record.id);
        }
      });
      return record;
    };
    if (key === "order") {
      service.lockForLifecycle = (props: { id: string }) =>
        repository.lockForLifecycle(props);
    }
    if (key === "payment") {
      service.lockOffers = (props: { offerIds: string[] }) =>
        repository.lockOffers(props);
    }
    services[key as keyof typeof paths] = service;
  }
  const product = await services.product.create({
    data: { slug: `wardrobe-${suffix}`, kind: "physical" },
  });
  const delivery = await services.product.create({
    data: { slug: `delivery-${suffix}`, kind: "service" },
  });
  const assembly = await services.product.create({
    data: { slug: `assembly-${suffix}`, kind: "service" },
  });
  const stores = await Promise.all(
    ["a", "b"].map((seller) =>
      services.store.create({ data: { slug: `seller-${seller}-${suffix}` } }),
    ),
  );
  const currency = await services.currency.create({
    data: { slug: `currency-${suffix}`, title: "Fixture RUB", symbol: "₽" },
  });
  const offers: any[][] = [];
  for (let seller = 0; seller < 2; seller += 1) {
    offers.push([]);
    for (const [role, item] of [
      ["product", product],
      ["delivery", delivery],
      ["assembly", assembly],
    ] as const) {
      offers[seller].push(
        await services.offer.create({
          data: {
            sku: `${role}-${seller}-${suffix}`,
            productId: item.id,
            storeId: stores[seller].id,
            configurationKey: "oak-120",
          },
        }),
      );
    }
  }
  let stock = 100;
  let serviceStock = 100;
  let serviceAvailable = 100;
  let version = "terms-1";
  let sharedServices = false;
  let pickup = false;
  services.offer.quote = jest.fn(async (input: any) => {
    const seller = offers.findIndex((set) => set[0].id === input.offerId);
    const set = offers[seller];
    const prices = seller === 0 ? [5000, 1000, 2000] : [5400, 500, 1500];
    const charges = [
      {
        offerId: input.offerId,
        productId: product.id,
        storeId: stores[seller].id,
        providerStoreId: stores[seller].id,
        role: "product",
        recurrence: "each",
        quantity: input.quantity,
        stockQuantity: stock,
        availableQuantity: stock,
        amount: String(prices[0] * input.quantity),
        formula: "unit_price * quantity",
        formulaVersion: "1",
        inputs: {},
      },
    ];
    let selectedServices = input.services ?? [];
    if (sharedServices && !selectedServices.length) {
      selectedServices = [{ offerId: offers[0][1].id, quantity: 1 }];
    }
    for (const selected of selectedServices) {
      const serviceSet = sharedServices ? offers[0] : set;
      const index = serviceSet.findIndex(
        (offer) => offer.id === selected.offerId,
      );
      if (index < 1) {
        throw new Error(
          "Validation error. Service belongs to another store offer",
        );
      }
      charges.push({
        ...charges[0],
        offerId: selected.offerId,
        productId: serviceSet[index].productId,
        storeId: serviceSet[index].storeId,
        providerStoreId: serviceSet[index].storeId,
        role: index === 1 ? "delivery" : "add-on",
        stockQuantity: serviceStock,
        availableQuantity: serviceAvailable,
        quantity: selected.quantity,
        amount: String(prices[index] * selected.quantity),
      });
    }
    return {
      ...input,
      productId: product.id,
      storeId: stores[seller].id,
      amount: String(
        charges.reduce((sum, charge) => sum + Number(charge.amount), 0),
      ),
      availableQuantity: stock,
      currencyIds: [currency.id],
      ...(sharedServices ? { selectedServices } : {}),
      ...(pickup ? { destination: {} } : {}),
      serviceOptions: [
        {
          offerId: sharedServices ? offers[1][1].id : set[1].id,
          compatibleOfferIds: sharedServices ? [offers[0][1].id] : [],
          productId: delivery.id,
          title: "Delivery",
          role: "delivery",
          receiptMethod: pickup ? "pickup" : "shipping",
          currencyIds: [currency.id],
        },
        {
          offerId: sharedServices ? offers[1][2].id : set[2].id,
          compatibleOfferIds: sharedServices ? [offers[0][2].id] : [],
          productId: assembly.id,
          title: "Assembly",
          role: "add-on",
          currencyIds: [currency.id],
        },
      ],
      charges,
      issues: [],
      version,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
  });
  services.offer.quoteMany = (inputs: any[]) =>
    Promise.all(inputs.map((input) => services.offer.quote(input)));
  services.offer.quotesUnderLock = (inputs: any[]) =>
    services.offer.quoteMany(inputs);
  const ecommerceModule: any = {
    product: services.product,
    order: services.order,
    ordersToProducts: services.line,
    storesToOrders: services.storeLink,
    ordersToBillingModuleCurrencies: services.currencyLink,
    ordersToBillingModulePaymentIntents: services.payment,
    storesToProducts: services.offer,
  };
  const access = new Access({
    subjectsToOrders: services.owner,
    ordersToProducts: services.line,
  });
  const subjectService: any = {
    repository: subjects,
    subjectsToIdentities: { find: jest.fn().mockResolvedValue([]) },
    ecommerceModule,
    subjectsToEcommerceModuleOrders: services.owner,
    ecommerceModuleOrderAssertAccess: access.execute.bind(access),
  };
  const operation = () =>
    new Selection({ repository: subjects, service: subjectService });
  const byOrder = (orderId: string) => ({
    params: {
      filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
    },
  });
  async function order(quantity = 2) {
    const order = await services.order.create({ data: {} });
    await services.owner.create({
      data: { subjectId: subject.id, ecommerceModuleOrderId: order.id },
    });
    const primary = await services.line.create({
      data: {
        orderId: order.id,
        productId: product.id,
        offerId: offers[0][0].id,
        quantity,
        destination: { address: "City address", region: "city" },
      },
    });
    await services.storeLink.create({
      data: { orderId: order.id, storeId: stores[0].id },
    });
    await services.currencyLink.create({
      data: { orderId: order.id, billingModuleCurrencyId: currency.id },
    });
    return { order, primary };
  }
  async function preview(
    target: Awaited<ReturnType<typeof order>>,
    selections: IEcommerceCartSelection[],
  ) {
    const primary = await services.line.findById({ id: target.primary.id });
    const data = { lineId: primary.id, selections };
    const result = await operation().execute({
      subjectId: subject.id,
      orderId: target.order.id,
      data: { ...data, action: "preview" },
    });
    return {
      ...data,
      action: "apply" as const,
      expectedVersions: result.quotes.map((quote) => quote.version),
      expectedSelectionUpdatedAt: new Date(
        primary.selectionUpdatedAt,
      ).toISOString(),
    };
  }
  const selected = (seller = 0, quantity = 1): IEcommerceCartSelection => ({
    offerId: offers[seller][0].id,
    quantity,
    currencyId: currency.id,
    destination: { address: "City address", region: "city" },
    services: [
      { offerId: offers[seller][1].id, quantity: 1 },
      { offerId: offers[seller][2].id, quantity: 1 },
    ],
  });
  return {
    subject,
    subjectService,
    subjects,
    services,
    stores,
    offers,
    currency,
    operation,
    byOrder,
    order,
    preview,
    selected,
    sharedServices() {
      sharedServices = true;
    },
    pickup() {
      pickup = true;
    },
    stock(value: number) {
      stock = value;
    },
    serviceStock(total: number, available: number) {
      serviceStock = total;
      serviceAvailable = available;
    },
    version(value: string) {
      version = value;
    },
  };
}

it("saves the clicked services with the current price and chains edits by the persisted revision", async () => {
  const f = await fixture();
  const { order, primary } = await f.order(1);
  const first = f.selected(0, 1);
  const originalRevision = new Date(primary.selectionUpdatedAt).toISOString();
  const save = (
    expectedSelectionUpdatedAt: string,
    selections: IEcommerceCartSelection[],
  ) =>
    f.operation().execute({
      subjectId: f.subject.id,
      orderId: order.id,
      data: {
        action: "save",
        lineId: primary.id,
        selections,
        expectedSelectionUpdatedAt,
      },
    });
  const result = await save(originalRevision, [first]);
  expect(result.applied).toBe(true);
  expect(result.quotes[0].charges).toHaveLength(3);
  const saved = await f.services.line.findById({ id: primary.id });
  expect(result.selectionUpdatedAt).toBe(
    new Date(saved.selectionUpdatedAt).toISOString(),
  );
  expect(result.selectionUpdatedAt).not.toBe(originalRevision);
  const withoutServices = { ...first, services: [] };
  await expect(save(originalRevision, [withoutServices])).rejects.toThrow(
    "Cart selection changed",
  );
  f.stock(0);
  const invalid = await save(result.selectionUpdatedAt!, [withoutServices]);
  expect(invalid.applied).toBe(false);
  expect(invalid.quotes[0].issues.length).toBeGreaterThan(0);
  expect(await f.services.line.find(f.byOrder(order.id))).toHaveLength(3);
  f.stock(100);
  const last = await save(result.selectionUpdatedAt!, [withoutServices]);
  expect(last.applied).toBe(true);
  expect(last.quotes[0].charges).toHaveLength(1);
  expect(await f.services.line.find(f.byOrder(order.id))).toHaveLength(1);
});

it.each(["preview", "save", "apply"] as const)(
  "rejects a multiple-destination %s before quoting or writing a cart graph",
  async (action) => {
    const f = await fixture();
    const source = await f.order(2);
    const beforeOwners = await f.services.owner.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: f.subject.id }],
        },
      },
    });
    await expect(
      f.operation().execute({
        subjectId: f.subject.id,
        orderId: source.order.id,
        data: {
          action,
          lineId: source.primary.id,
          selections: [
            f.selected(),
            { ...f.selected(), destination: { address: "Other address" } },
          ],
          expectedSelectionUpdatedAt: new Date(
            source.primary.selectionUpdatedAt,
          ).toISOString(),
        },
      }),
    ).rejects.toThrow("exactly one fulfillment selection");
    expect(f.services.offer.quote).not.toHaveBeenCalled();
    expect(await f.services.line.findById({ id: source.primary.id })).toEqual(
      source.primary,
    );
    expect(
      await f.services.owner.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: f.subject.id }],
          },
        },
      }),
    ).toEqual(beforeOwners);
  },
);

it("changes one seller atomically while a separate order retains its own address and offer", async () => {
  const f = await fixture();
  const first = await f.order(1);
  const untouched = await f.order(1);
  const data = await f.preview(first, [f.selected(1)]);
  await f
    .operation()
    .execute({ subjectId: f.subject.id, orderId: first.order.id, data });
  const primary = await f.services.line.findById({ id: first.primary.id });
  expect(primary.offerId).toBe(f.offers[1][0].id);
  expect(
    (await f.services.storeLink.find(f.byOrder(first.order.id)))[0].storeId,
  ).toBe(f.stores[1].id);
  expect(await f.services.line.findById({ id: untouched.primary.id })).toEqual(
    untouched.primary,
  );
});

it("clears stale pickup point data when changing the retail store and retains the independent line", async () => {
  const f = await fixture();
  f.pickup();
  const source = await f.order(1);
  const untouched = await f.order(1);
  const destination = {
    address: "Old address",
    region: "Old region",
    coordinates: { latitude: 60, longitude: 30 },
    pickupPointId: "point-at-another-shop",
  };
  const primary = await f.services.line.update({
    id: source.primary.id,
    data: { destination },
  });
  const selection = { ...f.selected(1), destination };
  const data = await f.preview({ ...source, primary }, [selection]);
  const result = await f
    .operation()
    .execute({ subjectId: f.subject.id, orderId: source.order.id, data });
  expect(result.quotes[0].destination).toEqual({});
  expect(result.quotes[0].storeId).toBe(f.stores[1].id);
  const saved = await f.services.line.findById({ id: primary.id });
  expect(saved.offerId).toBe(f.offers[1][0].id);
  expect(saved.destination).toEqual({});
  expect(
    (await f.services.storeLink.find(f.byOrder(source.order.id)))[0].storeId,
  ).toBe(f.stores[1].id);
  expect(await f.services.line.findById({ id: untouched.primary.id })).toEqual(
    untouched.primary,
  );
  expect(primary.destination).toEqual(destination);
});

it("retains exact contractor service aliases on a seller change and persists the server default", async () => {
  const f = await fixture();
  f.sharedServices();
  const source = await f.order(1);
  const services = f.selected(0).services;
  const changed = { ...f.selected(1), services };
  const preview = await f.operation().execute({
    subjectId: f.subject.id,
    orderId: source.order.id,
    data: {
      action: "preview",
      lineId: source.primary.id,
      selections: [changed],
    },
  });
  expect(preview.quotes[0].selectedServices).toEqual(services);
  expect(preview.comparisonQuotes?.[0].selectedServices).toEqual(services);
  const applied = await f.operation().execute({
    subjectId: f.subject.id,
    orderId: source.order.id,
    data: {
      action: "save",
      lineId: source.primary.id,
      selections: [changed],
      expectedSelectionUpdatedAt: new Date(
        source.primary.selectionUpdatedAt,
      ).toISOString(),
    },
  });
  const children = (
    await f.services.line.find(f.byOrder(source.order.id))
  ).filter((line: any) => line.parentLineId === source.primary.id);
  expect(children.map((line: any) => line.offerId).sort()).toEqual(
    services!.map((service) => service.offerId).sort(),
  );
  const defaulted = await f.operation().execute({
    subjectId: f.subject.id,
    orderId: source.order.id,
    data: {
      action: "save",
      lineId: source.primary.id,
      selections: [{ ...changed, services: [] }],
      expectedSelectionUpdatedAt: applied.selectionUpdatedAt,
    },
  });
  expect(defaulted.applied).toBe(true);
  const defaultChildren = (
    await f.services.line.find(f.byOrder(source.order.id))
  ).filter((line: any) => line.parentLineId === source.primary.id);
  expect(defaultChildren).toEqual([
    expect.objectContaining({ offerId: f.offers[0][1].id, quantity: 1 }),
  ]);
});

it("prepares a legacy primary and its default contractor service for confirmation together", async () => {
  const f = await fixture();
  f.sharedServices();
  const source = await f.order(1);
  const legacy = await f.services.line.update({
    id: source.primary.id,
    data: { offerId: null },
  });
  f.services.offer.offersForProduct = jest
    .fn()
    .mockResolvedValue([f.offers[0][0]]);
  const operation = new CheckoutLegacy({
    repository: f.subjects,
    ecommerceModule: f.subjectService.ecommerceModule,
    owners: f.services.owner,
  });
  await expect(
    operation.execute({
      subjectId: f.subject.id,
      orders: [source.order],
      lines: [legacy],
    }),
  ).rejects.toThrow("Confirm the updated store offer and charges");
  const lines = await f.services.line.find(f.byOrder(source.order.id));
  expect(lines).toHaveLength(2);
  expect(lines).toContainEqual(
    expect.objectContaining({
      id: legacy.id,
      offerId: f.offers[0][0].id,
      quoteVersion: "terms-1",
    }),
  );
  expect(lines).toContainEqual(
    expect.objectContaining({
      parentLineId: legacy.id,
      offerId: f.offers[0][1].id,
      quantity: 1,
    }),
  );
  expect(
    await f.services.payment.find(f.byOrder(source.order.id)),
  ).toHaveLength(0);
});

it("rolls back a seller and service change when its store link fails", async () => {
  const f = await fixture();
  const source = await f.order(1);
  const data = await f.preview(source, [f.selected(1)]);
  jest
    .spyOn(f.services.storeLink, "update")
    .mockRejectedValueOnce(new Error("fixture link failure"));
  await expect(
    f
      .operation()
      .execute({ subjectId: f.subject.id, orderId: source.order.id, data }),
  ).rejects.toThrow("fixture link failure");
  expect(await f.services.line.findById({ id: source.primary.id })).toEqual(
    source.primary,
  );
  expect(
    await f.services.owner.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: f.subject.id }],
        },
      },
    }),
  ).toHaveLength(1);
  expect(await f.services.line.find(f.byOrder(source.order.id))).toHaveLength(
    1,
  );
});

it("refuses expired terms and stale buyer selection without changing the cart", async () => {
  const f = await fixture();
  const source = await f.order(1);
  const data = await f.preview(source, [f.selected(1)]);
  f.version("terms-2");
  await expect(
    f
      .operation()
      .execute({ subjectId: f.subject.id, orderId: source.order.id, data }),
  ).rejects.toThrow("Offer terms changed");
  f.version("terms-1");
  await f.services.line.update({
    id: source.primary.id,
    data: { selectionUpdatedAt: new Date(Date.now() + 1000) },
  });
  await expect(
    f
      .operation()
      .execute({ subjectId: f.subject.id, orderId: source.order.id, data }),
  ).rejects.toThrow("Cart selection changed");
  expect(
    (await f.services.line.findById({ id: source.primary.id })).offerId,
  ).toBe(f.offers[0][0].id);
});

it("serializes concurrent edits so the buyer's independent lines cannot exceed one offer's stock", async () => {
  const f = await fixture();
  f.stock(3);
  const first = await f.order(1);
  const second = await f.order(1);
  const firstData = await f.preview(first, [
    { ...f.selected(0, 2), services: [] },
  ]);
  const secondData = await f.preview(second, [
    { ...f.selected(0, 2), services: [] },
  ]);
  const results = await Promise.allSettled([
    f.operation().execute({
      subjectId: f.subject.id,
      orderId: first.order.id,
      data: firstData,
    }),
    f.operation().execute({
      subjectId: f.subject.id,
      orderId: second.order.id,
      data: secondData,
    }),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  const quantities = await Promise.all(
    [first, second].map(
      async (target) =>
        (await f.services.line.findById({ id: target.primary.id })).quantity,
    ),
  );
  expect(quantities.sort()).toEqual([1, 2]);
});

it("refuses a foreign subject and multiple selections before any selection writes", async () => {
  const f = await fixture();
  const source = await f.order(2);
  await expect(
    f.operation().execute({
      subjectId: randomUUID(),
      orderId: source.order.id,
      data: {
        action: "preview",
        lineId: source.primary.id,
        selections: [f.selected()],
      },
    }),
  ).rejects.toThrow("does not belong");
  await expect(
    f.preview(source, [f.selected(0, 2), f.selected()]),
  ).rejects.toThrow("exactly one fulfillment selection");
  expect(await f.services.line.findById({ id: source.primary.id })).toEqual(
    source.primary,
  );
});

it("subtracts external service reservations before accepting one service selection", async () => {
  const f = await fixture();
  f.serviceStock(3, 1);
  const source = await f.order(2);
  const selections = [
    {
      ...f.selected(0, 2),
      services: [{ offerId: f.offers[0][1].id, quantity: 2 }],
    },
  ];
  const result = await f.operation().execute({
    subjectId: f.subject.id,
    orderId: source.order.id,
    data: { action: "preview", lineId: source.primary.id, selections },
  });
  expect(result.quotes.every((quote) => quote.amount === null)).toBe(true);
  expect(result.quotes[0].issues).toContainEqual(
    expect.objectContaining({
      code: "insufficient_stock",
      offerId: f.offers[0][1].id,
      available: 1,
    }),
  );
  const data = await f.preview(source, selections);
  await expect(
    f
      .operation()
      .execute({ subjectId: f.subject.id, orderId: source.order.id, data }),
  ).rejects.toThrow("resolve quote issues");
  expect(
    (await f.services.line.findById({ id: source.primary.id })).quantity,
  ).toBe(2);
  f.serviceStock(3, 2);
  const confirmed = await f.preview(source, selections);
  expect(
    (
      await f.operation().execute({
        subjectId: f.subject.id,
        orderId: source.order.id,
        data: confirmed,
      })
    ).orderIds,
  ).toHaveLength(1);
});

it("merges the latest complete Product selection, retaining independent orders and child services", async () => {
  const f = await fixture();
  const guest = await f.subjects.insert({
    slug: `issue414-guest-${randomUUID()}`,
  });
  cleanup.push(() => f.subjects.deleteFirstByField("id", guest.id));
  const account = await f.order(1);
  const guestFirst = await f.order(1);
  const guestSecond = await f.order(1);
  const earlier = new Date("2026-01-01T00:00:00Z");
  const later = new Date("2026-01-02T00:00:00Z");
  await f.services.line.update({
    id: account.primary.id,
    data: { selectionUpdatedAt: earlier },
  });
  for (const [index, target] of [guestFirst, guestSecond].entries()) {
    const [owner] = await f.services.owner.find({
      params: {
        filters: {
          and: [
            {
              column: "ecommerceModuleOrderId",
              method: "eq",
              value: target.order.id,
            },
          ],
        },
      },
    });
    await f.services.owner.update({
      id: owner.id,
      data: { subjectId: guest.id },
    });
    await f.services.line.update({
      id: target.primary.id,
      data: { selectionUpdatedAt: index === 0 ? later : earlier },
    });
    await f.services.line.create({
      data: {
        orderId: target.order.id,
        productId: f.offers[0][1].productId,
        offerId: f.offers[0][1].id,
        parentLineId: target.primary.id,
        quantity: 1,
      },
    });
  }
  expect(RBAC_JWT_SECRET).toBeTruthy();
  const guestToken = await sign(
    {
      subject: { id: guest.id },
      type: "access",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    RBAC_JWT_SECRET!,
  );
  await new MergeGuestCart(f.subjectService).execute({
    subjectId: f.subject.id,
    guestToken,
  });
  const owners = await f.services.owner.find({
    params: {
      filters: {
        and: [{ column: "subjectId", method: "eq", value: f.subject.id }],
      },
    },
  });
  expect(
    owners
      .map(
        (owner: { ecommerceModuleOrderId: string }) =>
          owner.ecommerceModuleOrderId,
      )
      .sort(),
  ).toEqual([guestFirst.order.id, guestSecond.order.id].sort());
  expect(await f.services.order.findById({ id: account.order.id })).toBeFalsy();
  for (const target of [guestFirst, guestSecond]) {
    const lines = await f.services.line.find(f.byOrder(target.order.id));
    expect(lines).toHaveLength(2);
    expect(
      lines.find((line: { parentLineId: string }) => line.parentLineId),
    ).toMatchObject({
      parentLineId: target.primary.id,
      offerId: f.offers[0][1].id,
    });
  }
});
