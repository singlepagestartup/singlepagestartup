/**
 * BDD Suite: atomic open-cart product uniqueness.
 *
 * Given: isolated Subjects and a Product in PostgreSQL.
 * When: independent service instances add the same Product concurrently or a graph write fails.
 * Then: one open cart survives, failures roll back, and history and other Subjects remain independent.
 */
import { randomUUID } from "node:crypto";
import { CRUDService } from "@sps/shared-backend-api";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Service as Create } from "./create";
import { Service as FindOpenCart } from "./find-open-cart-order-with-product";
import { Service as CartSelection } from "./selection";

const paths = {
  product: "@sps/ecommerce/models/product",
  offers: "@sps/ecommerce/relations/stores-to-products",
  payments: "@sps/ecommerce/relations/orders-to-billing-module-payment-intents",
  store: "@sps/ecommerce/models/store",
  currency: "@sps/billing/models/currency",
  order: "@sps/ecommerce/models/order",
  owners: "@sps/rbac/relations/subjects-to-ecommerce-module-orders",
  lines: "@sps/ecommerce/relations/orders-to-products",
  stores: "@sps/ecommerce/relations/stores-to-orders",
  currencies: "@sps/ecommerce/relations/orders-to-billing-module-currencies",
};

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of cleanup.splice(0).reverse()) await remove();
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const suffix = randomUUID();
  const subjects = new SubjectRepository(new SubjectConfiguration());
  const subject = await subjects.insert({ slug: `pr264-${suffix}` });
  if (!subject.id) throw new Error("Fixture Subject has no ID");
  cleanup.push(() => subjects.deleteFirstByField("id", subject.id));
  const services: Record<string, any> = {};
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
      const entity = await create(props);
      cleanup.push(async () => {
        if (await repository.findFirstByField("id", entity.id))
          await repository.deleteFirstByField("id", entity.id);
      });
      return entity;
    };
    if (key === "payments") {
      service.lockOffers = (props: { offerIds: string[] }) =>
        repository.lockOffers(props);
    }
    services[key] = service;
  }
  const product = await services.product.create({
    data: { slug: `pr264-${suffix}` },
  });
  const store = await services.store.create({
    data: { slug: `pr264-${suffix}` },
  });
  const currency = await services.currency.create({
    data: { slug: `pr264-${suffix}`, title: "Cart test", symbol: "test" },
  });
  const offer = await services.offers.create({
    data: {
      productId: product.id,
      storeId: store.id,
      sku: `issue414-${suffix}`,
    },
  });
  services.offers.offersForProduct = async ({
    productId,
  }: {
    productId: string;
  }) => (productId === product.id ? [offer] : []);
  services.offers.quote = jest.fn(async (input: any) => ({
    ...input,
    productId: product.id,
    storeId: store.id,
    amount: "100",
    availableQuantity: null,
    currencyIds: [currency.id],
    serviceOptions: [],
    charges: [],
    issues: [],
    version: "fixture-v1",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  }));
  services.offers.quotesUnderLock = async (_inputs: any[], previews: any[]) =>
    previews;
  const ecommerceModule = {
    order: services.order,
    storesToProducts: services.offers,
    ordersToBillingModulePaymentIntents: services.payments,
    ordersToProducts: services.lines,
    storesToOrders: services.stores,
    ordersToBillingModuleCurrencies: services.currencies,
  } as any;
  const find = new FindOpenCart({
    ecommerceModule,
    subjectsToEcommerceModuleOrders: services.owners,
  });
  const dependencies: any = {
    billingModule: { currency: services.currency },
    ecommerceModule,
    subjectsToEcommerceModuleOrders: services.owners,
    ecommerceModuleFindOpenCartOrderWithProduct: find.execute.bind(find),
    ecommerceModuleResolveOrderCurrency: jest
      .fn()
      .mockResolvedValue(currency.id),
  };
  dependencies.ecommerceModuleCartQuote = (props: any) =>
    new CartSelection({ repository: subjects, service: dependencies }).quote(
      props,
    );
  const create = new Create({ repository: subjects, service: dependencies });
  const otherInstance = new Create({
    repository: new SubjectRepository(new SubjectConfiguration()),
    service: dependencies,
  });
  const props = {
    subjectId: subject.id,
    productId: product.id,
    storeId: store.id,
    quantity: 2,
    billingModuleCurrencyId: currency.id,
  };
  const owners = () =>
    services.owners.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: subject.id }],
        },
      },
    });
  return {
    create,
    otherInstance,
    props,
    services,
    subjects,
    dependencies,
    owners,
  };
}

it("serializes concurrent adds of the same offer across service instances", async () => {
  const f = await fixture();
  const results = await Promise.allSettled([
    f.create.execute(f.props),
    f.otherInstance.execute(f.props),
    f.create.execute(f.props),
    f.otherInstance.execute(f.props),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  for (const result of results.filter((r) => r.status === "rejected")) {
    expect(result.reason.message).toBe(
      "Conflict error. Product is already in the cart",
    );
  }
  const links = await f.owners();
  expect(links).toHaveLength(1);
  const orderId = links[0].ecommerceModuleOrderId;
  for (const key of ["lines", "stores", "currencies"]) {
    const rows = await f.services[key].find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    });
    expect(rows).toHaveLength(1);
    if (key === "lines") expect(rows[0].quantity).toBe(2);
  }
  f.services.offers.quote.mockResolvedValue({
    currencyIds: [],
    issues: [{ code: "configuration", message: "price removed" }],
  });
  await expect(f.create.execute(f.props)).rejects.toThrow(
    "Conflict error. Product is already in the cart",
  );
  expect(await f.owners()).toHaveLength(1);
});

it("rejects a direct multiple-fulfillment request before creating a cart graph", async () => {
  const f = await fixture();
  const selectedServices: { offerId: string; quantity: number }[] = [];
  for (const method of ["shipping", "pickup"]) {
    const product = await f.services.product.create({
      data: { slug: `${method}-${randomUUID()}`, kind: "service" },
    });
    const offer = await f.services.offers.create({
      data: {
        productId: product.id,
        storeId: f.props.storeId,
        sku: `${method}-${randomUUID()}`,
      },
    });
    selectedServices.push({ offerId: offer.id, quantity: 1 });
  }
  const originalQuote = f.services.offers.quote.getMockImplementation();
  f.services.offers.quote.mockImplementation(async (input: any) => ({
    ...(await originalQuote(input)),
    amount: null,
    issues: [
      {
        code: "unavailable",
        offerId: input.services[1].offerId,
        message: "Choose one delivery method",
      },
    ],
  }));
  await expect(
    f.create.execute({
      ...f.props,
      services: selectedServices,
    }),
  ).rejects.toThrow("Choose one delivery method");
  expect(await f.owners()).toHaveLength(0);
  expect(
    await f.services.lines.find({
      params: {
        filters: {
          and: [
            { column: "productId", method: "eq", value: f.props.productId },
          ],
        },
      },
    }),
  ).toHaveLength(0);
});

it("rolls back the complete graph on a relation failure and permits a clean retry", async () => {
  const f = await fixture();
  const failedWrite = jest
    .spyOn(f.services.stores, "create")
    .mockRejectedValueOnce(new Error("fixture relation failure"));
  await expect(f.create.execute(f.props)).rejects.toThrow(
    "fixture relation failure",
  );
  expect(await f.owners()).toHaveLength(0);
  const lines = await f.services.lines.find({
    params: {
      filters: {
        and: [{ column: "productId", method: "eq", value: f.props.productId }],
      },
    },
  });
  expect(lines).toHaveLength(0);
  failedWrite.mockRestore();
  await f.create.execute(f.props);
  expect(await f.owners()).toHaveLength(1);
});

it("allows a repeat purchase after history transition and an independent Subject cart", async () => {
  const f = await fixture();
  await f.create.execute(f.props);
  const [link] = await f.owners();
  await f.services.order.update({
    id: link.ecommerceModuleOrderId,
    data: { type: "history" },
  });
  await f.create.execute(f.props);
  expect(await f.owners()).toHaveLength(2);
  const other = await f.subjects.insert({
    slug: `pr264-other-${randomUUID()}`,
  });
  if (!other.id) throw new Error("Fixture Subject has no ID");
  cleanup.push(() => f.subjects.deleteFirstByField("id", other.id));
  await f.otherInstance.execute({ ...f.props, subjectId: other.id });
});
