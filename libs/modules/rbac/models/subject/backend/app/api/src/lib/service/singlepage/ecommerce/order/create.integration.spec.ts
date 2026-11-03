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

const paths = {
  product: "@sps/ecommerce/models/product",
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
    const service = new CRUDService(repository);
    const create = service.create.bind(service);
    service.create = async (props: any) => {
      const entity = await create(props);
      cleanup.push(async () => {
        if (await repository.findFirstByField("id", entity.id))
          await repository.deleteFirstByField("id", entity.id);
      });
      return entity;
    };
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
  const ecommerceModule = {
    order: services.order,
    ordersToProducts: services.lines,
    storesToOrders: services.stores,
    ordersToBillingModuleCurrencies: services.currencies,
  } as any;
  const find = new FindOpenCart({
    ecommerceModule,
    subjectsToEcommerceModuleOrders: services.owners,
  });
  const dependencies = {
    ecommerceModule,
    subjectsToEcommerceModuleOrders: services.owners,
    ecommerceModuleFindOpenCartOrderWithProduct: find.execute.bind(find),
    ecommerceModuleResolveOrderCurrency: jest
      .fn()
      .mockResolvedValue(currency.id),
  };
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

it("serializes concurrent adds across service instances and rejects an existing line before pricing", async () => {
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
  f.dependencies.ecommerceModuleResolveOrderCurrency.mockRejectedValue(
    new Error("price removed"),
  );
  await expect(f.create.execute(f.props)).rejects.toThrow(
    "Conflict error. Product is already in the cart",
  );
  expect(await f.owners()).toHaveLength(1);
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
